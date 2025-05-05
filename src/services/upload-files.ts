
import {
	uploadFiles as uploadFilesLighthouse,
	uploadText,
} from "@/lib/filecoin/lighthouse/isomorphic";


import type { Progress } from "ky";

export type UploadFilesParams<T> = T & {
	uploadProgressCallback?: (data: Progress) => void;
};

export type UploadFormParams<T> = {
	isShowProgress?: boolean;
	uploadFiles: (params: UploadFilesParams<T>) => Promise<any>;
};

export enum UploadFormType {
	Text = "text",
	File = "file",
	FileMultiple = "file-multiple",
	FileDirectory = "file-directory",
	MultifieldsAsDirectory = "multifields-as-directory",
}

const apiKey = import.meta.env.LIGHTHOUSE_API_KEY;

// Lighthouse effectively submit to their endpoint with another form data based request

export const uploadFiles = async ({
    file,
    uploadProgressCallback,
}: UploadFilesParams<{ file: File }>) => {

    // Upload the temporary file to Lighthouse
    const response = await uploadFilesLighthouse(
        [file],
        apiKey,
        uploadProgressCallback,
    );
    return response;
}
