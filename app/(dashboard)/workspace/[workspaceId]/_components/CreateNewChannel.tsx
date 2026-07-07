"use client";

import {
  ChannelNameSchema,
  ChannelNameSchemaType,
  transformChannelName,
} from "@/app/schemas/channel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function CreateNewChannel() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(ChannelNameSchema),
    defaultValues: {
      name: "",
    },
  });

  const createChannelMutation = useMutation(
    orpc.channel.create.mutationOptions({
      onSuccess: (newChannel) => {
        toast.success(`Channel ${newChannel.name} created Successfully!`);
        queryClient.invalidateQueries({
          queryKey: orpc.channel.list.queryKey(),
        });
        form.reset();
        setOpen(false);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
          return;
        }

        toast.error("Failed to create channel. Please try again!");
      },
    }),
  );

  const watchedName = form.watch("name");
  const transformedName = watchedName ? transformChannelName(watchedName) : "";

  function onSubmit(values: ChannelNameSchemaType) {
    createChannelMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="size-4" />
          Add Channel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Create new Channel to get started!
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <Input placeholder="My Channel" {...form.register("name")} />
            </FieldContent>
            {transformedName && transformedName !== watchedName && (
              <p className="text-sm text-muted-foreground">
                Will be created as:{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                  {transformedName}
                </code>
              </p>
            )}
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Button type="submit" disabled={createChannelMutation.isPending}>
            {createChannelMutation.isPending
              ? "Creating..."
              : "Create new Channel"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
