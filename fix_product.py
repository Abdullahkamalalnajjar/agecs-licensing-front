import re

with open('src/components/ProductFormModal.tsx', 'r') as f:
    content = f.read()

# Fix 1: mapPeriodType
content = content.replace(
"""const mapPeriodType = (pt: any) => {
  if (pt === "Day" || pt === 1) return 1;
  if (pt === "Month" || pt === 2) return 2;
  if (pt === "Year" || pt === 3) return 3;
  return 1;
};""",
"""const mapPeriodType = (pt: any): 'Day' | 'Month' | 'Year' => {
  if (pt === "Day" || pt === 1) return "Day";
  if (pt === "Month" || pt === 2) return "Month";
  if (pt === "Year" || pt === 3) return "Year";
  return "Day";
};"""
)

# Fix 2: state type
content = content.replace(
"""  const [prices, setPrices] = useState<{ id?: string, period: number, periodType?: number, price: number, country: string, active: boolean }[]>(
    initialData?.prices && initialData.prices.length > 0 
      ? initialData.prices.map((p: any) => ({ id: p.id, period: p.period || 1, periodType: mapPeriodType(p.periodType), price: p.price || 0, country: p.country || "II", active: p.active ?? true }))
      : [{ period: 1, periodType: 1, price: 0, country: "II", active: true }]
  );""",
"""  const [prices, setPrices] = useState<{ id?: string, period: number, periodType?: 'Day' | 'Month' | 'Year', price: number, country: string, active: boolean }[]>(
    initialData?.prices && initialData.prices.length > 0 
      ? initialData.prices.map((p: any) => ({ id: p.id, period: p.period || 1, periodType: mapPeriodType(p.periodType), price: p.price || 0, country: p.country || "II", active: p.active ?? true }))
      : [{ period: 1, periodType: "Day", price: 0, country: "II", active: true }]
  );"""
)

# Fix 3: payload
content = content.replace(
"""          period: Number(p.period) || 1,
          periodType: Number(p.periodType) || 1,
          active: p.active""",
"""          period: Number(p.period) || 1,
          periodType: p.periodType || "Day",
          active: p.active"""
)

# Fix 4: select input
content = content.replace(
"""                          <select className="form-input" style={{ padding: "0.4rem" }} value={priceObj.periodType || 1} onChange={(e) => {
                            const newPrices = [...prices];
                            newPrices[index].periodType = Number(e.target.value);
                            setPrices(newPrices);
                          }}>
                            <option value={1}>Days</option>
                            <option value={2}>Months</option>
                            <option value={3}>Years</option>
                          </select>""",
"""                          <select className="form-input" style={{ padding: "0.4rem" }} value={priceObj.periodType || "Day"} onChange={(e) => {
                            const newPrices = [...prices];
                            newPrices[index].periodType = e.target.value as 'Day' | 'Month' | 'Year';
                            setPrices(newPrices);
                          }}>
                            <option value="Day">Days</option>
                            <option value="Month">Months</option>
                            <option value="Year">Years</option>
                          </select>"""
)

with open('src/components/ProductFormModal.tsx', 'w') as f:
    f.write(content)

