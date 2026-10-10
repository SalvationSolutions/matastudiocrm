// D1 POS import: server-only, atomic and idempotent by source IDs.
// Input is a validated, scoped POS export; never call from a public browser route.
const required=(v,name)=>{const s=String(v??"").trim();if(!s||s.length>160)throw Error("Invalid "+name);return s};
const txt=v=>v==null?null:String(v).slice(0,500);
const money=v=>{const n=Number(v);if(!Number.isFinite(n)||Math.abs(n)>1e10)throw Error("Invalid amount");return Math.round(n*100)};
export async function importPosBatch(db,table,records){
  if(!["Customers","Sales","SaleItems","VoidsRefunds"].includes(table)||!Array.isArray(records)||records.length>100)throw Error("Invalid import batch");
  const sql=[];
  for(const r of records){
    if(!r||typeof r!=="object"||Array.isArray(r))throw Error("Invalid record");
    if(table==="Customers"){
      const key=required(r.CustomerID,"CustomerID"),crm="pos:"+key;
      sql.push(db.prepare("INSERT INTO crm_pos_customers(pos_customer_id,first_name,last_name,email,mobile,source_updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(pos_customer_id) DO UPDATE SET first_name=excluded.first_name,last_name=excluded.last_name,email=excluded.email,mobile=excluded.mobile,source_updated_at=excluded.source_updated_at,synced_at=CURRENT_TIMESTAMP").bind(key,txt(r.FirstName),txt(r.LastName),txt(r.Email),txt(r.Mobile),txt(r.UpdatedAt)));
      sql.push(db.prepare("INSERT INTO crm_profiles(customer_id,display_name) VALUES(?,?) ON CONFLICT(customer_id) DO NOTHING").bind(crm,[r.FirstName,r.LastName].filter(Boolean).join(" ").slice(0,300)));
      sql.push(db.prepare("INSERT INTO crm_pos_customer_links(pos_customer_id,crm_customer_id,match_method) VALUES(?,?,'new_profile') ON CONFLICT(pos_customer_id) DO NOTHING").bind(key,crm));
    }else if(table==="Sales"){
      sql.push(db.prepare("INSERT INTO crm_pos_sales(invoice_no,pos_customer_id,business_date,sold_at,status,total_centavos,source_updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(invoice_no) DO UPDATE SET pos_customer_id=excluded.pos_customer_id,business_date=excluded.business_date,sold_at=excluded.sold_at,status=excluded.status,total_centavos=excluded.total_centavos,source_updated_at=excluded.source_updated_at,synced_at=CURRENT_TIMESTAMP").bind(required(r.InvoiceNo,"InvoiceNo"),txt(r.CustomerID),txt(r.BusinessDate),txt(r.DateTime),required(r.Status,"Status"),money(r.Total),txt(r.CreatedAt)));
    }else if(table==="SaleItems"){
      const qty=Number(r.Qty);if(!Number.isFinite(qty))throw Error("Invalid Qty");
      sql.push(db.prepare("INSERT INTO crm_pos_sale_items(sale_item_id,invoice_no,sku,product_name,quantity,line_total_centavos) VALUES(?,?,?,?,?,?) ON CONFLICT(sale_item_id) DO UPDATE SET invoice_no=excluded.invoice_no,sku=excluded.sku,product_name=excluded.product_name,quantity=excluded.quantity,line_total_centavos=excluded.line_total_centavos").bind(required(r.SaleItemID,"SaleItemID"),required(r.InvoiceNo,"InvoiceNo"),txt(r.SKU),txt(r.ProductName),qty,money(r.LineTotal)));
    }else{
      sql.push(db.prepare("INSERT INTO crm_pos_reversals(reversal_id,invoice_no,reversal_type,status,amount_centavos,occurred_at) VALUES(?,?,?,?,?,?) ON CONFLICT(reversal_id) DO UPDATE SET invoice_no=excluded.invoice_no,reversal_type=excluded.reversal_type,status=excluded.status,amount_centavos=excluded.amount_centavos,occurred_at=excluded.occurred_at,synced_at=CURRENT_TIMESTAMP").bind(required(r.ReversalID,"ReversalID"),required(r.InvoiceNo,"InvoiceNo"),required(r.Type,"Type"),required(r.Status,"Status"),money(r.Amount),txt(r.DateTime)));
    }
  }
  if(sql.length)await db.batch(sql);
  return {table,count:records.length};
}
