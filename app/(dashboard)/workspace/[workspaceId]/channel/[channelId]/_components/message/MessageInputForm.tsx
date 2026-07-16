"use client";

import {
  createMessageSchema,
  CreateMessageSchemaType,
} from "@/app/schemas/message";
import { Field, FieldError } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { MessageComposer } from "./MessageComposer";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { useState } from "react";
import { useAttachmentUpload } from "@/hooks/use-attachment-upload";
import { Message } from "@/lib/generated/prisma/client";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { getAvatar } from "@/lib/get-avatar";

interface MessageInputFormProps {
  channelId: string;
  user: KindeUser<Record<string, unknown>>;
}

type MessagePage = {
  items: Message[];
  nextCursor?: string;
};
type InfiniteMessages = InfiniteData<MessagePage>;

export function MessageInputForm({ channelId, user }: MessageInputFormProps) {
  const queryClient = useQueryClient();
  const [editorKey, setEditorKey] = useState(0);
  const upload = useAttachmentUpload();

  const form = useForm({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      channelId,
      content: "",
    },
  });

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async (data) => {
        await queryClient.cancelQueries({
          queryKey: ["message.list", channelId],
        });

        const previousData = queryClient.getQueryData<InfiniteMessages>([
          "message.list",
          channelId,
        ]);

        const tempId = `optimistic-${crypto.randomUUID()}`;

        const optimisticMessage: Message = {
          id: tempId,
          content: data.content,
          imageUrl: data.imageUrl ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: user.id,
          authorEmail: user.email ?? "",
          authorName: user.given_name ?? "",
          authroAvatar: getAvatar(user.picture, user.email ?? ""),
          channelId,
        };

        queryClient.setQueryData<InfiniteMessages>(
          ["message.list", channelId],
          (existingData) => {
            if (!existingData) {
              return {
                pages: [
                  {
                    items: [optimisticMessage],
                    nextCursor: undefined,
                  },
                ],
                pageParams: [undefined],
              } satisfies InfiniteMessages;
            }

            const firstPage = existingData.pages[0] ?? {
              items: [],
              nextCursor: undefined,
            };

            const updatedFirstPage: MessagePage = {
              ...firstPage,
              items: [optimisticMessage, ...firstPage.items],
            };

            return {
              ...existingData,
              pages: [updatedFirstPage, ...existingData.pages.slice(1)],
            };
          },
        );

        return { previousData, tempId };
      },
      onSuccess: (data, _variables, context) => {
        queryClient.setQueryData<InfiniteMessages>(
          ["message.list", channelId],
          (existingData) => {
            if (!existingData) return existingData;

            const updatedPages = existingData.pages.map((page) => ({
              ...page,
              items: page.items.map((message) =>
                message.id === context.tempId
                  ? {
                      ...data,
                    }
                  : message,
              ),
            }));

            return { ...existingData, pages: updatedPages };
          },
        );

        form.reset({ channelId, content: "" });
        upload.clear();
        setEditorKey((k) => k + 1);
      },
      onError: (_err, _variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            ["message.list", channelId],
            context.previousData,
          );
        }

        return toast.error("Something went wrong");
      },
    }),
  );

  function onSubmit(data: CreateMessageSchemaType) {
    createMessageMutation.mutate({
      ...data,
      imageUrl: upload.stageUrl ?? undefined,
    });
  }

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
