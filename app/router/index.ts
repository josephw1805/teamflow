import { createChannel, listChannels } from "./channel";
import { createMessage, listMessages } from "./message";
import { createWorkspace, listWorkspace } from "./workspace";

export const router = {
  workspace: {
    list: listWorkspace,
    create: createWorkspace,
  },
  channel: {
    list: listChannels,
    create: createChannel,
  },
  message: {
    list: listMessages,
    create: createMessage,
  },
};
