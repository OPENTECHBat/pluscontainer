from odoo import models, fields

class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    show_min_qty_field = fields.Boolean(string="Show Minimum Stock Qty Field", config_parameter='stock_quantity_alert.show_min_qty_field')