/**
 * Diagram block for the EmDash Portable Text editor.
 *
 * Editors pick a light and a dark image from the Media Library, then add alt
 * text and an optional caption. The site renders the block with
 * `src/components/portable-text/Diagram.astro`, which shows the image that
 * matches the active Theme.
 */
import { definePlugin } from "emdash";

const id = "plugin-diagram";
const version = "0.1.0";

/** @returns {import("emdash").PluginDescriptor} */
export function diagramPlugin() {
  return {
    id,
    version,
    format: "native",
    entrypoint: "@huntsyea/plugin-diagram",
  };
}

export function createPlugin() {
  return definePlugin({
    id,
    version,
    admin: {
      portableTextBlocks: [
        {
          type: "diagram",
          label: "Diagram",
          icon: "image",
          description: "A light and a dark image that follow the site theme",
          category: "Media",
          fields: [
            {
              type: "media_picker",
              action_id: "light",
              label: "Light image",
              mime_type_filter: "image/",
            },
            {
              type: "media_picker",
              action_id: "dark",
              label: "Dark image",
              mime_type_filter: "image/",
            },
            {
              type: "text_input",
              action_id: "alt",
              label: "Alt text",
              multiline: true,
            },
            {
              type: "text_input",
              action_id: "caption",
              label: "Caption",
              multiline: true,
            },
          ],
        },
      ],
    },
  });
}

export default createPlugin;
