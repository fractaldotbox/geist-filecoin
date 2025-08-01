import { Input } from "@/components/react/ui/input";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";

export const FileInput = ({
	field,
	isMultipleFiles,
	isAcceptDirectory,
}: {
	field: ControllerRenderProps<FieldValues, string>;
	isMultipleFiles?: boolean;
	isAcceptDirectory?: boolean;
}) => {
	const inputFileProps = {
		multiple: isMultipleFiles,
	};
	if (isAcceptDirectory) {
		//@ts-ignore
		inputFileProps.webkitdirectory = "true";
	}

	return (
		<Input
			id="file"
			type="file"
			className="cursor-pointer"
			{...field}
			{...inputFileProps}
			value={field?.value?.fileName}
			onChange={(event) => {
				const files = event?.target?.files;
				const file = (
					isMultipleFiles || isAcceptDirectory ? files : files?.[0]
				) as File;

				if (file) {
					field.onChange({
						url: URL.createObjectURL(file),
						file,
					});
				}

				// field.onChange(file);
			}}
		/>
	);
};
