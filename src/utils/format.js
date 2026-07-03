export const statusText = {
  PENDING_PAY: '待支付',
  PAID: '已支付',
  WAITING: '待处理',
  SUCCESS: '成功'
}

export const flowText = {
  PURCHASE_IN: '采购入库',
  DAMAGE_OUT: '报损出库',
  CHECK_GAIN: '盘盈',
  CHECK_LOSS: '盘亏',
  ORDER_OUT: '订单扣减'
}

export function money(value) {
  return Number(value || 0).toFixed(2)
}

export function dateText(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 19)
}

export function productName(products, productId) {
  return products.find((item) => item.id === productId)?.name || `商品 #${productId}`
}

export function categoryName(categories, categoryId) {
  if (!categoryId) return '未分类'
  return categories.find((item) => item.id === categoryId)?.name || `分类 #${categoryId}`
}
