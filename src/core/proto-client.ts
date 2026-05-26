import { getProtoEndpoint, type ProtoEndpointId } from '@/api/proto-endpoints';
import { load } from '@/core/proto-loader';
import { postProtobuf, type RequestOptions } from '@/core/request';

export interface ProtoCallOptions extends RequestOptions {
    bduss?: string;
}

export function createCommon(clientVersion: string, options: ProtoCallOptions = {}): Record<string, unknown> {
    const common: Record<string, unknown> = {
        _clientType: 2,
        _clientVersion: clientVersion,
    };

    if (options.bduss) {
        common.BDUSS = options.bduss;
    }

    return common;
}

export async function callProtoEndpoint<TRequest extends object, TResponse>(
    endpointId: ProtoEndpointId,
    requestData: TRequest,
    options: ProtoCallOptions = {}
): Promise<TResponse> {
    const endpoint = getProtoEndpoint(endpointId);
    const { encode } = await load<TRequest>(endpoint.requestMessage);
    const { decode } = await load<TResponse>(endpoint.responseMessage);
    const requestBuffer = encode(requestData);
    const responseBase64 = await postProtobuf(endpoint.url, requestBuffer, {
        ...options,
        fileName: options.fileName ?? endpoint.fileName,
    });

    const responseBuffer = base64ToBytes(responseBase64);
    return decode(responseBuffer);
}

function base64ToBytes(value: string): Uint8Array {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}
