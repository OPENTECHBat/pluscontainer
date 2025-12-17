from odoo import models, fields, api


class StockAlert(models.Model):
    _name = 'stock.alert'
    _description = 'Low Stock Alert'

    product_id = fields.Many2one('product.template', string='Product', required=True)
    qty_available = fields.Float(string='Available Quantity')

    @api.model
    def check_low_stock_products(self):
        self.env['stock.alert'].sudo().search([]).unlink()
        low_stock_products = [] # Collect all low-stock products
        products = self.env['product.template'].search([])

        for product in products:
            min_qty = product.min_qty
            current_qty = product.qty_available  # this is computed from stock.quants
            if min_qty and current_qty < min_qty:
                # Create alert record
                self.create({
                    'product_id': product.id,
                    'qty_available': current_qty,
                })
                low_stock_products.append(product) # Add to list for email

        if low_stock_products:
            template = self.env.ref('stock_quantity_alert.mail_template_low_stock')
            ctx = {'low_stock_products': low_stock_products, 'user': self.env.user}
            template.with_context(ctx).send_mail(self.env.user.id, force_send=True) # Note: send_mail will render using the QWeb template with context