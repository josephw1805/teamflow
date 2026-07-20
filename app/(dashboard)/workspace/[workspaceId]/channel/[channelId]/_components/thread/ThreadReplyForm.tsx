import {
  createMessageSchema,
  CreateMessageSchemaType,
} from "@/app/schemas/message";
import { Field, FieldError } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { MessageComposer } from "../message/MessageComposer";
import { useAttachmentUpload } from "@/hooks/use-attachment-upload";
import { useEffect, useState } from "react";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { getAvatar } from "@/lib/get-avatar";
import { MessageListItem } from "@/lib/types";

interface ThreadReplyFormProps {
  threadId: string;
  user: KindeUser<Record<string, unknown>>;
}

export function ThreadReplyForm({ threadId, user }: ThreadReplyFormProps) {
  const { channelId } = useParams<{ channelId: string }>();
  const upload = useAttachmentUpload();
  const [editorKey, setEditorKey] = useState(0);
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      channelId,
      content: "",
      threadId,
    },
  });

  useEffect(() => {
    form.setValue("threadId", threadId);
  }, [threadId, form]);

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async (data) => {
        const listOptions = orpc.message.thread.list.queryOptions({
          input: {
            messageId: threadId,
          },
        });

        type MessagePage = {
          items: Array<MessageListItem>;
          nextCursor?: string;
        };

        type InfiniteMessages = InfiniteData<MessagePage>;

        await queryClient.cancelQueries({ queryKey: listOptions.queryKey });

        const previous = queryClient.getQueryData(listOptions.queryKey);

        const optimistic: MessageListItem = {
          id: `optimistic-${crypto.randomUUID()}`,
          content: data.content,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: user.id,
          authorEmail: user.email ?? "",
          authorName: user.given_name ?? "",
          authroAvatar: getAvatar(user.picture, user.email ?? ""),
          channelId: data.channelId,
          threadId: data.threadId ?? "",
          imageUrl: data.imageUrl ?? null,
          reactions: [],
          replyCount: 0,
        };

        queryClient.setQueryData(listOptions.queryKey, (existingData) => {
          if (!existingData) return existingData;
          return {
            ...existingData,
            messages: [...existingData.messages, optimistic],
          };
        });

        queryClient.setQueryData<InfiniteMessages>(
          ["message.list", channelId],
          (existingData) => {
            if (!existingData) return existingData;

            const pages = existingData.pages.map((page) => ({
              ...page,
              items: page.items.map((message) =>
                message.id === threadId
                  ? { ...message, replyCount: message.replyCount + 1 }
                  : message,
              ),
            }));

            return { ...existingData, pages };
          },
        );

        return { listOptions, previous };
      },

      onSuccess: (_data, _vars, ctx) => {
        queryClient.invalidateQueries({ queryKey: ctx.listOptions.queryKey });
        form.reset({ channelId, content: "", threadId });
        upload.clear();
        setEditorKey((k) => k + 1);
      },
      onError: (_err, _vars, ctx) => {
        if (!ctx) return;

        const { listOptions, previous } = ctx;

        if (previous) {
          queryClient.setQueryData(listOptions.queryKey, previous);
        }
      },
    }),
  );

  const onSubmit = (data: CreateMessageSchemaType) => {
    createMessageMutation.mutate({
      ...data,
      imageUrl: upload.stageUrl ?? undefined,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        name="content"
        control={form.control}
        render={({ field }) => (
          <Field>
            <MessageComposer
              key={editorKey}
              value={field.value}
              onChange={field.onChange}
              onSubmit={() => onSubmit(form.getValues())}
              isSubmitting={createMessageMutation.isPending}
              upload={upload}
            />
            <FieldError />
          </Field>
        )}
      />
    </form>
  );
}
