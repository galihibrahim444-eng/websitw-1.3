import type { PesananRow } from "@/data/pesanan";

export const buildShippingLabelDocument = (orders: PesananRow[]) => {
  const labelHtml = orders
    .map((order) => {
      return `
      <section class="label-page">
        <div class="label-card">
          <div class="label-header">
            <div class="logo-placeholder">LOGO</div>
            <div class="label-title">Label Pengiriman</div>
          </div>

          <div class="label-row">
            <div>
              <p class="label-field">Nomor Resi</p>
              <p class="label-value">${order.resi}</p>
            </div>
            <div>
              <p class="label-field">Marketplace</p>
              <p class="label-value">${order.marketplace}</p>
            </div>
          </div>

          <div class="label-row">
            <div>
              <p class="label-field">Pembeli</p>
              <p class="label-value">${order.buyer}</p>
            </div>
            <div>
              <p class="label-field">Kurir</p>
              <p class="label-value">${order.kurir}</p>
            </div>
          </div>

          <div class="label-block">
            <p class="label-field">Alamat</p>
            <p class="label-value">Jl. Contoh No. 123, Jakarta</p>
          </div>

          <div class="label-row">
            <div>
              <p class="label-field">Toko</p>
              <p class="label-value">${order.store}</p>
            </div>
            <div>
              <p class="label-field">Marketplace</p>
              <p class="label-value">${order.marketplace}</p>
            </div>
          </div>

          <div class="barcode-box">
            ${Array.from({ length: 26 })
              .map((_, index) => {
                const width = index % 5 === 0 ? 3 : 1.5;
                return `<span class="barcode-line" style="width:${width}px"></span>`;
              })
              .join("")}
          </div>
          <div class="barcode-value">${order.resi}</div>
        </div>
      </section>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Print Label Pengiriman</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f4f5f7;
      }
      .label-page {
        width: 100mm;
        min-height: 150mm;
        padding: 12mm;
        box-sizing: border-box;
        page-break-after: always;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .label-card {
        width: 100%;
        min-height: 100%;
        background: #ffffff;
        border: 1px solid #d1d5db;
        border-radius: 14px;
        padding: 16px;
        box-sizing: border-box;
        display: grid;
        gap: 16px;
      }
      .label-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .logo-placeholder {
        width: 70px;
        height: 34px;
        background: #e2e8f0;
        border-radius: 8px;
        display: grid;
        place-items: center;
        font-size: 11px;
        letter-spacing: 0.18em;
        color: #475569;
      }
      .label-title {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
      }
      .label-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .label-block {
        background: #f8fafc;
        border-radius: 12px;
        padding: 12px;
      }
      .label-field {
        font-size: 9px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        margin: 0;
      }
      .label-value {
        margin: 4px 0 0;
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
      }
      .barcode-box {
        display: flex;
        align-items: flex-end;
        gap: 2px;
        padding: 14px 0 6px;
      }
      .barcode-line {
        height: 48px;
        background: #0f172a;
        display: inline-block;
      }
      .barcode-value {
        font-size: 11px;
        letter-spacing: 0.1em;
        color: #334155;
      }
      @media print {
        body {
          background: #ffffff;
        }
        .label-page {
          margin: 0;
          box-shadow: none;
          page-break-after: always;
        }
        .label-card {
          border: none;
          border-radius: 0;
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>${labelHtml}</body>
</html>`;
};

export const printShippingLabels = (orders: PesananRow[]) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;

  const html = buildShippingLabelDocument(orders);
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  const callPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch {
      // silent fail if browser blocks print or close
    }
  };

  if (printWindow.document.readyState === "complete") {
    callPrint();
  } else {
    printWindow.addEventListener("load", callPrint);
  }

  return true;
};
