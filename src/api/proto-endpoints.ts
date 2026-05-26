export type ProtoAuthPolicy = 'none' | 'cookie';

export interface ProtoMessageConfig {
    path: string;
    namespace: string;
}

export interface ProtoEndpointConfig {
    id: string;
    url: string;
    requestMessage: string;
    responseMessage: string;
    clientVersion: string;
    fileName: string;
    auth: ProtoAuthPolicy;
}

export const PROTO_MESSAGES: Record<string, ProtoMessageConfig> = {
    ProfileReqIdl: { path: 'Profile/ProfileReqIdl.proto', namespace: 'Profile' },
    ProfileResIdl: { path: 'Profile/ProfileResIdl.proto', namespace: 'Profile' },
    UserPostReqIdl: { path: 'UserPost/UserPostReqIdl.proto', namespace: 'UserPost' },
    UserPostResIdl: { path: 'UserPost/UserPostResIdl.proto', namespace: 'UserPost' },
    PbPageReqIdl: { path: 'PbPage/PbPageReqIdl.proto', namespace: 'PbPage' },
    PbPageResIdl: { path: 'PbPage/PbPageResIdl.proto', namespace: 'PbPage' },
};

export const PROTO_ENDPOINTS = {
    threadPage: {
        id: 'threadPage',
        url: 'http://tiebac.baidu.com/c/f/pb/page?cmd=302001',
        requestMessage: 'PbPageReqIdl',
        responseMessage: 'PbPageResIdl',
        clientVersion: '12.79.1.0',
        fileName: 'file',
        auth: 'cookie',
    },
    userProfile: {
        id: 'userProfile',
        url: 'http://tiebac.baidu.com/c/u/user/profile?cmd=303012',
        requestMessage: 'ProfileReqIdl',
        responseMessage: 'ProfileResIdl',
        clientVersion: '12.79.1.0',
        fileName: 'file',
        auth: 'none',
    },
    userPosts: {
        id: 'userPosts',
        url: 'https://tiebac.baidu.com/c/u/feed/userpost?cmd=303002',
        requestMessage: 'UserPostReqIdl',
        responseMessage: 'UserPostResIdl',
        clientVersion: '8.9.8.5',
        fileName: 'file',
        auth: 'none',
    },
} as const satisfies Record<string, ProtoEndpointConfig>;

export type ProtoEndpointId = keyof typeof PROTO_ENDPOINTS;

export function getProtoMessageConfig(messageName: string): ProtoMessageConfig {
    const config = PROTO_MESSAGES[messageName];
    if (!config) {
        throw new Error(`Unknown protobuf message "${messageName}". Add it to PROTO_MESSAGES first.`);
    }
    return config;
}

export function getProtoEndpoint(endpointId: ProtoEndpointId): ProtoEndpointConfig {
    return PROTO_ENDPOINTS[endpointId];
}
