import { readTextFile } from '@tauri-apps/plugin-fs';
import { resolveResource } from '@tauri-apps/api/path';
import * as protobuf from 'protobufjs';
import { getProtoMessageConfig } from '@/api/proto-endpoints';

const protoRoots = new Map<string, protobuf.Root>();
const fileCache = new Map<string, string>();
const rootParsedFiles = new Map<string, Set<string>>();
const rootLoadingFiles = new Map<string, Set<string>>();
const messageLoaderCache = new Map<string, ProtoLoader>();

async function readProtoFile(protoPath: string): Promise<string> {
    if (fileCache.has(protoPath)) {
        return fileCache.get(protoPath)!;
    }

    try {
        const resourcePath = await resolveResource(`proto/${protoPath}`);
        const content = await readTextFile(resourcePath);
        fileCache.set(protoPath, content);
        return content;
    } catch (error: any) {
        throw new Error(`Failed to read proto file ${protoPath}: ${error.message}`);
    }
}

function extractImports(protoContent: string): string[] {
    const imports: string[] = [];
    const importRegex = /^\s*import\s+["']([^"']+)["']\s*;/gm;
    let match: RegExpExecArray | null;

    while ((match = importRegex.exec(protoContent)) !== null) {
        imports.push(match[1]);
    }

    return imports;
}

async function loadProtoWithDependencies(
    root: protobuf.Root,
    rootKey: string,
    protoPath: string,
    depth = 0
): Promise<void> {
    if (!rootParsedFiles.has(rootKey)) {
        rootParsedFiles.set(rootKey, new Set());
    }
    if (!rootLoadingFiles.has(rootKey)) {
        rootLoadingFiles.set(rootKey, new Set());
    }

    const parsedFiles = rootParsedFiles.get(rootKey)!;
    const loadingFiles = rootLoadingFiles.get(rootKey)!;

    if (parsedFiles.has(protoPath)) {
        return;
    }

    if (loadingFiles.has(protoPath)) {
        console.warn(`[Warn] Circular dependency detected: ${protoPath}`);
        return;
    }

    if (depth > 50) {
        console.error(`[Error] Max recursion depth reached for: ${protoPath}`);
        return;
    }

    loadingFiles.add(protoPath);

    try {
        const content = await readProtoFile(protoPath);
        const imports = extractImports(content);

        for (const importPath of imports) {
            if (!parsedFiles.has(importPath)) {
                await loadProtoWithDependencies(root, rootKey, importPath, depth + 1);
            }
        }

        protobuf.parse(content, root, { keepCase: false });
        parsedFiles.add(protoPath);
    } catch (error: any) {
        throw new Error(`Failed to parse proto file ${protoPath}: ${error.message}`);
    } finally {
        loadingFiles.delete(protoPath);
    }
}

function getProtoRoot(rootKey: string): protobuf.Root {
    if (!protoRoots.has(rootKey)) {
        const root = new protobuf.Root();
        protoRoots.set(rootKey, root);
    }
    return protoRoots.get(rootKey)!;
}

async function loadProtoForMessage(messageName: string): Promise<protobuf.Root> {
    const config = getProtoMessageConfig(messageName);
    const rootKey = config.namespace;
    const root = getProtoRoot(rootKey);

    await loadProtoWithDependencies(root, rootKey, config.path);

    return root;
}

export interface ProtoLoader<T = any> {
    encode: (data: T) => Uint8Array;
    decode: (buffer: Uint8Array) => T;
}

export async function load<T = any>(messageName: string): Promise<ProtoLoader<T>> {
    try {
        if (messageLoaderCache.has(messageName)) {
            return messageLoaderCache.get(messageName)! as ProtoLoader<T>;
        }

        const protoRoot = await loadProtoForMessage(messageName);
        const MessageType = protoRoot.lookupType(messageName);

        if (!MessageType) {
            throw new Error(`no such type: ${messageName}`);
        }

        const loader: ProtoLoader<T> = {
            encode: (data: T): Uint8Array => {
                const message = MessageType.create(data as any);
                return MessageType.encode(message).finish();
            },

            decode: (buffer: Uint8Array): T => {
                try {
                    const message = MessageType.decode(buffer);
                    return MessageType.toObject(message, {
                        longs: String,
                        enums: String,
                        bytes: String,
                        defaults: true,
                        arrays: true,
                        objects: true
                    }) as T;
                } catch (error) {
                    console.error('Proto decode error:', error);
                    throw error;
                }
            }
        };

        messageLoaderCache.set(messageName, loader);
        return loader;
    } catch (error) {
        console.error(`[Error] Loading proto message ${messageName}:`, error);
        throw error;
    }
}
