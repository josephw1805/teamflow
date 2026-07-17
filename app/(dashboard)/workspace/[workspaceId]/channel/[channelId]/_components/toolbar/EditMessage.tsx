import {
  updateMessageSchema,
  UpdateMessageSchemaType,
} from "@/app/schemas/message";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Message } from "@/lib/generated/prisma/client";
import { orpc } from "@/lib/orpc";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface EditMessageProps {
  message: Message;
  onCancel: () => void;
  onSave: () => void;
}

export function EditMessage({ message, onCancel, onSave }: EditMessageProps) {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(updateMessageSchema),
    defaultValues: {
      messageId: message.id,
      content: message.content,
    },
  });

  const updateMutation = useMutation(
    orpc.message.update.mutationOptions({
      onSuccess: (updated) => {
        type MessagePage = { items: Message[]; nextCursor?: string };
        type InfiniteMessages = InfiniteData<MessagePage>;

        queryClient.setQueryData<InfiniteMessages>(
          ["message.list", message.channelId],
          (existingData) => {
            if (!existingData) return existingData;
            const updatedMessage = updated.message;
            const pages = existingData.pages.map((page) => ({
              ...page,
              items: page.items.map((message) =>
                message.id === updatedMessage.id
                  ? { ...message, ...updatedMessage }
                  : message,
              ),
            }));

            return {
              ...existingData,
              pages,
            };
          },
        );
        onSave();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  function onSubmit(data: UpdateMessageSchemaType) {
    updateMutation.mutate(data);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        name="content"
        control={form.control}
        render={({ field }) => (
          <Field>
            <RichTextEditor
              field={field}
              sendButton={
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onCancel}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={updateMutation.isPending}
                    type="submit"
                    size="sm"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              }
            />
            <FieldError />
          </Field>
        )}
      />
    </form>
  );
}
