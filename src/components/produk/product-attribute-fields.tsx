import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShopeeAttribute } from "@/services/attributeService";
import type { ProductAttribute } from "@/lib/product-information";

type Props = {
  attributes: ShopeeAttribute[];
  loading: boolean;
  value: ProductAttribute[];
  onChange: (next: ProductAttribute[]) => void;
};

/**
 * Renderer atribut kategori dinamis. Semua definisi berasal dari
 * AttributeService (dummy → Shopee API). Komponen ini tidak mengetahui
 * atribut apa pun secara hardcoded.
 */
export function ProductAttributeFields({
  attributes,
  loading,
  value,
  onChange,
}: Props) {
  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Memuat atribut...</p>
    );
  }
  if (!attributes.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Pilih kategori terlebih dahulu untuk memuat atribut.
      </p>
    );
  }

  const upsert = (attr: ShopeeAttribute, next: ProductAttribute) => {
    const idx = value.findIndex(
      (v) => String(v.attributeId) === String(attr.attribute_id),
    );
    const list = [...value];
    if (idx >= 0) list[idx] = next;
    else list.push(next);
    onChange(list);
  };

  const getCurrent = (attr: ShopeeAttribute): ProductAttribute | undefined =>
    value.find((v) => String(v.attributeId) === String(attr.attribute_id));

  return (
    <div className="space-y-4">
      {attributes.map((attr) => {
        const current = getCurrent(attr);
        const primary = current?.values[0];

        const setValue = (v: {
          value: string;
          valueId?: string | number;
        }) => {
          upsert(attr, {
            attributeId: attr.attribute_id,
            attributeName: attr.display_attribute_name,
            required: attr.is_mandatory,
            values: [{ value: v.value, valueId: v.valueId }],
          });
        };

        return (
          <div
            key={attr.attribute_id}
            className="grid grid-cols-[160px_1fr] items-start gap-4"
          >
            <Label className="pt-2 text-sm">
              {attr.display_attribute_name}
              {attr.is_mandatory && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </Label>
            <div className="max-w-md">
              {attr.input_validation_type === "ENUM_TYPE" ? (
                <Select
                  value={
                    primary?.valueId != null ? String(primary.valueId) : undefined
                  }
                  onValueChange={(v) => {
                    const picked = attr.attribute_value_list.find(
                      (o) => String(o.value_id) === v,
                    );
                    if (picked)
                      setValue({
                        valueId: picked.value_id,
                        value: picked.display_value_name,
                      });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- Pilihan --" />
                  </SelectTrigger>
                  <SelectContent>
                    {attr.attribute_value_list.map((o) => (
                      <SelectItem key={o.value_id} value={String(o.value_id)}>
                        {o.display_value_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={
                    attr.input_validation_type === "INT_TYPE" ||
                    attr.input_validation_type === "FLOAT_TYPE"
                      ? "number"
                      : attr.input_validation_type === "DATE_TYPE"
                        ? "date"
                        : "text"
                  }
                  value={primary?.value ?? ""}
                  onChange={(e) => setValue({ value: e.target.value })}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
