import type { PluginRegistry } from "@embedpdf/react-pdf-viewer";

/**
 * Study viewer: trim editing tools and document menu actions.
 * @see https://www.embedpdf.com/docs/react/viewer/customizing-ui
 */
export const LECTURE_VIEWER_DISABLED_CATEGORIES: string[] = [
  "form",
  "redaction",
  "insert",
  "mode-form",
  "mode-redact",
  "mode-insert",
  "mode-shapes",
  "shape",
  "annotation-shape",
  "document-open",
  "document-close",
  "document-export",
  "document-protect",
];

/** Document menu (top-left): print + screenshot only. */
const STUDY_DOCUMENT_MENU_ITEMS = [
  {
    type: "command",
    id: "document:print",
    commandId: "document:print",
    categories: ["document", "document-print"],
  },
  {
    type: "command",
    id: "document:capture",
    commandId: "document:capture",
    categories: ["document", "document-capture"],
  },
] as const;

type UiCapability = {
  getSchema: () => {
    toolbars: Record<string, { items: unknown[] }>;
    menus: Record<string, { items: Array<{ id?: string; commandId?: string }> }>;
  };
  mergeSchema: (partial: {
    toolbars?: Record<string, { items: unknown[] }>;
    menus?: Record<string, { items: unknown[] }>;
  }) => void;
};

type ToolbarGroup = {
  id?: string;
  items?: Record<string, unknown>[];
};

/**
 * Customize toolbar after the default schema is loaded (see EmbedPDF customizing-ui docs).
 * Do not pass a partial `ui.schema` in config — it replaces the default and breaks plugins.
 */
export function customizeLectureViewerUi(registry: PluginRegistry): void {
  const ui = (
    registry.getPlugin("ui") as { provides: () => UiCapability } | null
  )?.provides();
  if (!ui) return;

  const schema = ui.getSchema();
  const mainToolbar = schema.toolbars["main-toolbar"];
  if (mainToolbar?.items) {
    const items = structuredClone(mainToolbar.items) as ToolbarGroup[];
    const rightGroup = items.find((item) => item.id === "right-group");
    if (rightGroup?.items) {
      rightGroup.items.push({
        type: "command-button",
        id: "fullscreen-toolbar-button",
        commandId: "document:fullscreen",
        variant: "icon",
        categories: ["document", "document-fullscreen"],
      });
    }
    ui.mergeSchema({
      toolbars: { "main-toolbar": { ...mainToolbar, items } },
    });
  }

  const docMenu = schema.menus["document-menu"];
  if (docMenu) {
    ui.mergeSchema({
      menus: {
        "document-menu": {
          ...docMenu,
          items: [...STUDY_DOCUMENT_MENU_ITEMS],
        },
      },
    });
  }
}
