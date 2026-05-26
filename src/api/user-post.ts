import { callProtoEndpoint, createCommon, type ProtoCallOptions } from '@/core/proto-client';

export async function user_post_protobuf(
    userId: string | number,
    page = 1,
    options: ProtoCallOptions = {}
): Promise<any> {
    try {
        const requestData = {
            data: {
                uid: userId,
                rn: 20,
                needContent: 1,
                pn: page,
                common: createCommon('8.9.8.5', options)
            },
        };

        const response = await callProtoEndpoint<any, any>('userPosts', requestData, options);

        if (response.error && response.error.errorno) {
            throw new Error(`Tieba server error: ${response.error.errorno} - ${response.error.errmsg}`);
        }

        return response;
    } catch (error) {
        console.error('Error in user_post_protobuf:', error);
        throw error;
    }
}
