import re

with open('src/components/ProductFormModal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""                  <button type="button" className="btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => setPrices([...prices, { period: 1, periodType: 1, price: 0, country: "II", active: true }])}>""",
"""                  <button type="button" className="btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => setPrices([...prices, { period: 1, periodType: "Day", price: 0, country: "II", active: true }])}>"""
)

with open('src/components/ProductFormModal.tsx', 'w') as f:
    f.write(content)

