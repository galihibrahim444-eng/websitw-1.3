/**
 * Implementasi dummy `ICategoryService`.
 *
 * Bentuk data mengikuti Shopee Open API (`/product/get_category`) —
 * cukup ganti implementasi ini dengan varian Shopee bila sudah siap,
 * tanpa mengubah konsumen (hook / UI).
 */

import type {
  CategoryOption,
  CategoryTreeNode,
  ICategoryService,
  ShopeeCategoryNode,
} from "./types";

const DUMMY_CATEGORIES: ShopeeCategoryNode[] = [
  { category_id: 100, parent_category_id: 0,   original_category_name: "Fashion",       display_category_name: "Fashion",       has_children: true  },
  { category_id: 101, parent_category_id: 100, original_category_name: "Men's Apparel", display_category_name: "Pakaian Pria",  has_children: true  },
  { category_id: 102, parent_category_id: 101, original_category_name: "Shirts",        display_category_name: "Kemeja",        has_children: false },
  { category_id: 103, parent_category_id: 101, original_category_name: "T-Shirts",      display_category_name: "Kaos",          has_children: false },
  { category_id: 104, parent_category_id: 100, original_category_name: "Women Apparel", display_category_name: "Pakaian Wanita",has_children: true  },
  { category_id: 105, parent_category_id: 104, original_category_name: "Dress",         display_category_name: "Dress",         has_children: false },

  { category_id: 200, parent_category_id: 0,   original_category_name: "Electronics",   display_category_name: "Elektronik",    has_children: true  },
  { category_id: 201, parent_category_id: 200, original_category_name: "Mobile Phone",  display_category_name: "Handphone",     has_children: false },
  { category_id: 202, parent_category_id: 200, original_category_name: "Laptop",        display_category_name: "Laptop",        has_children: false },
];

function buildTree(nodes: ShopeeCategoryNode[]): CategoryTreeNode[] {
  const byId = new Map<number, CategoryTreeNode>();
  nodes.forEach((n) =>
    byId.set(n.category_id, {
      id: n.category_id,
      name: n.display_category_name,
      children: [],
    }),
  );
  const roots: CategoryTreeNode[] = [];
  nodes.forEach((n) => {
    const node = byId.get(n.category_id)!;
    if (n.parent_category_id === 0) roots.push(node);
    else byId.get(n.parent_category_id)?.children.push(node);
  });
  return roots;
}

function collectLeaves(
  tree: CategoryTreeNode[],
  trail: { id: number; name: string }[] = [],
  out: CategoryOption[] = [],
): CategoryOption[] {
  tree.forEach((node) => {
    const path = [...trail, { id: node.id, name: node.name }];
    if (node.children.length === 0) {
      out.push({
        id: node.id,
        name: node.name,
        path,
        label: path.map((p) => p.name).join(" > "),
      });
    } else {
      collectLeaves(node.children, path, out);
    }
  });
  return out;
}

export const dummyCategoryService: ICategoryService = {
  async getCategoryTree() {
    return buildTree(DUMMY_CATEGORIES);
  },
  async getCategoryOptions() {
    return collectLeaves(buildTree(DUMMY_CATEGORIES));
  },
};
