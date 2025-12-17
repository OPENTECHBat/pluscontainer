/** @odoo-module **/

import {useService,useBus} from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";
import {Component, useState, onWillStart} from "@odoo/owl";
import {Mutex} from "@web/core/utils/concurrency";
//import core from 'web.core';
import {SearchBar} from "@custom_barcode_app/js/warehouse_operations/AddProductsPopUp";
import {SearchBar1} from "@custom_barcode_app/js/warehouse_operations/AddProductsPopUp";
import {WarehouseDetailsTable} from "@custom_barcode_app/js/warehouse_operations/AddProductsPopUp";
const actionRegistry = registry.category("actions");

export class ProductDetails extends Component {

    constructor(...args) {
        super(...args);
        this.state = useState({part: {}, part_available: false, popup_visible: false})
    }

    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.mutex = new Mutex();
        const barcode_scanned = useService("barcode");
        useBus(barcode_scanned.bus, "barcode_scanned", (ev) => this.onBarcodeScanned(ev.detail.barcode));

        this.notificationService = useService("notification");
        onWillStart(async () => {
            if (this.props.action.params.barcode) {
                let scanned_part = await this.getProductData(this.props.action.params.barcode)

                await this.getData(scanned_part)
            }
        });

    }

    onBarcodeScanned(barcode) {
        this.mutex.exec(async () => {
            let scanned_part = await this.getProductData(barcode)
            if (scanned_part.length === 1) {
                await this.getData(scanned_part)
            } else {
                this.notificationService.add("Error,Barcode not found", {
                    title: "Error",
                    type: "danger",
                })
                this.onPlaySound('error')

            }
        })
    }

    delay = ms => new Promise(res => setTimeout(res, ms));


    getProductData = async (barcode) => {
        return await this.orm.searchRead("product.product", [["barcode", "=", barcode]], ["id", "type", "default_code", "categ_id", "weight", "list_price", "display_name"], {limit: 100})
    }
    editPopUp = () => {
        this.state.popup_visible = true
    }
    closePopUp = () => {
        this.state.popup_visible = false

    }

    selectProductSearchBar = async (part) => {
        await this.getData([part])
    }

    backButtonClick() {
//        core.bus.off('barcode_scanned', this, this.onBarcodeScanned());
        if (this.env.config.breadcrumbs.length > 0) {
            this.actionService.restore();
        }
    }

    imageUrl(id, write_date) {
        return `/web/image?model=product.product&field=image_512&id=${id}&write_date=${write_date}&unique=1`;
    }

    getData = async (scanned_part) => {
        let data =  await this.orm.call("product.product", "get_product_info_barcode_app",  [[scanned_part[0].id], 1]);
//        let data = await this.rpcService(`/web/dataset/call_kw/product.product/get_product_info_barcode_app`, {
//            model: 'product.product',
//            method: 'get_product_info_barcode_app',
//            args: [[scanned_part[0].id], 1],
//            kwargs: {}
//            //context: {},
//        });

        let product_data = {
            product_details: [data.product_data],
            warehouses: data.warehouses,
            warehouse_list_without_zero_stock: data.warehouse_list_without_zero_stock,
            suppliers: data.suppliers,
            variants: data.variants,
            price_lists: data.price_list,
            user_id: data.user_id,
            company_id: data.company_id,
            currency_data: data.currency_data,
        }
        this.state.part = product_data
        this.state.part_available = true
    }
        onPlaySound(name) {
        let src;
        if (name === 'error') {
            src = "/custom_barcode_app/static/src/sounds/error.wav";
            let audio = new Audio(src)
            audio.play()

        } else if (name === 'bell') {
            src = "/custom_barcode_app/static/src/sounds/bell.wav";
            let audio = new Audio(src)
            audio.play()
        }

    }
}


ProductDetails.template = "custom_barcode_app.ProductDetails"
ProductDetails.components = {SearchBar, WarehouseDetailsTable, SearchBar1};
actionRegistry.add('product_information', ProductDetails);
