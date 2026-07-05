"use client";

import { workspaceSchema, WorkspaceSchemaType } from "@/app/schemas/workspace";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { orpc } from "@/lib/orpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function CreateWorkspace() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
    },
  });

  const createWorkspaceMutation = useMutation(
    orpc.workspace.create.mutationOptions({
      onSuccess: (newWorkspace) => {
        toast.success(
          `Workspace ${newWorkspace.workspaceName} created successfully`,
        );

        queryClient.invalidateQueries({
          queryKey: orpc.workspace.list.queryKey(),
        });

        form.reset();
        setOpen(false);
      },
      onError: () => {
        toast.error("Failed to create workspace, try again!");
      },
    }),
  );

  function onSubmit(values: WorkspaceSchemaType) {
    createWorkspaceMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-12 rounded-xl border-2 border-dashed border-muted-foreground/50 text-muted-foreground hover:border-muted-foreground hover:text-foreground hover:rounded-lg transition-all duration-200"
              >
                <Plus className="size-5" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Create Workspace</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to get started
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <Input placeholder="My Workspace" {...form.register("name")} />
            </FieldContent>
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Button type="submit" disabled={createWorkspaceMutation.isPending}>
            {createWorkspaceMutation.isPending
              ? "Creating..."
              : "Create Workspace"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
