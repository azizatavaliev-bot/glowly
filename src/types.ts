export type Product = {
  id: number
  name: string
  full: string
  brand: string
  spec: string | null
  unit: string
  barcode: string | null
  pack: string | null
  packQty: number | null
  price: number
  img: string | null
  cat: string
  sale: string | null
  exp: string | null
}

export type Meta = {
  currency: string
  date: string
  site: string
  contact: string
}
