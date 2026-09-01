import type { BlockNoteEditor } from "@blocknote/core";

type EditorInstance = BlockNoteEditor<any, any, any>;

export function getBlockIdAtPos(
  editor: EditorInstance,
  getPos: () => number | undefined
): string | undefined {
  const pos = getPos();
  if (typeof pos !== "number") return undefined;

  const $pos = editor.prosemirrorState.doc.resolve(pos);
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === "blockContainer" && typeof node.attrs.id === "string") {
      return node.attrs.id;
    }
  }

  return undefined;
}
