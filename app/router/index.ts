import { createChannel, getChannel, listChannels } from "./channel";
import { inviteMember, listMembers } from "./member";
import {
  createMessage,
  listMessages,
  listThreadReplies,
  toggleReaction,
  updateMessage,
} from "./message";
import { createWorkspace, listWorkspace } from "./workspace";

export const router = {
  workspace: {
    list: listWorkspace,
    create: createWorkspace,
    member: {
      list: listMembers,
      invite: inviteMember,
    },
  },
  channel: {
    list: listChannels,
    create: createChannel,
    get: getChannel,
  },
  message: {
    list: listMessages,
    create: createMessage,
    update: updateMessage,
    reactions: {
      toggle: toggleReaction,
    },
    thread: {
      list: listThreadReplies,
    },
  },
};
