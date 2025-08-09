const formatPrice = (price: number) =>
new Intl.NumberFormat("es-CL", {
style: "currency",
currency: "CLP",
minimumFractionDigits: 0,
maximumFractionDigits: 0,
})
.format(Math.max(0, price || 0))
.replace("$", "") + "$";
