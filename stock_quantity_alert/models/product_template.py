from odoo import models, fields, api

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    min_qty = fields.Float(string="Minimum Stock Qty", help="When stock goes below this, alert is triggered.")
    hide_custom_field_flag = fields.Boolean(
        compute='_compute_hide_custom_field_flag')

    @api.depends_context('lang')  # Minimal dependency
    def _compute_hide_custom_field_flag(self):
        param = self.env['ir.config_parameter'].sudo().get_param(
            'stock_quantity_alert.show_min_qty_field', 'False')
        for rec in self:
            rec.hide_custom_field_flag = param == 'True'