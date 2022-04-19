import empty from "is-empty"
import db from "../../database/conexion_sequelize"
import sequelize from "sequelize"
import Caja from "../../model/Caja/Caja";
import axios from 'axios'
import { SacarTotalesVenta } from "../reporte/reporte";
import Reporte from "../../model/Reporte/Reporte";
import Movimiento from "../../model/Caja/Movimiento";

export async function ListarCajaActual(req, res) {
    try {
        const { empresa, fecha_ini, fecha_fin, estado } = req.body;
        let sql = `SELECT * FROM esq_reporte.caja WHERE empresa = '${empresa}' AND estado = '${estado}' AND fecha_cuadre BETWEEN '${fecha_ini}' and '${fecha_fin}' ORDER BY id DESC LIMIT 1 `
        db.query(sql,{type: sequelize.QueryTypes.SELECT}).then((response)=>{
            console.log("reporte",response);
            if(!empty(response)){
                res.json({
                    success: true,
                    data: response,
                    msg:'reporte por fecha',
                })
            }else{
                res.json({msg: "no se encontro reporte"})
            }
        }).catch((err)=>{
            console.log("Error", err);
        })
    } catch (error) {
        console.log("ListarReporte", error)
    }
}
export async function CrearCuadreCaja(req, res) {
    try {
        const { empresa, fecha_cuadre, usuario, estado, conteo } = req.body
        let fecha_ini = fecha_cuadre
        let fecha_fin = fecha_cuadre
        const respuesta = await SacarTotalesVenta(empresa, fecha_ini, fecha_fin, estado)
        console.log("CrearCuadreCaja", parseFloat(respuesta.total_venta))
        var totalventa = respuesta.total_venta !=null ? parseFloat(respuesta.total_venta) : 0
        const {ingreso, salida} = await TotalMovimientos(empresa,fecha_cuadre,estado)
        var venta = respuesta.total_venta !=null ? parseFloat(respuesta.total_venta) : 0
        totalventa += ingreso != null ? parseFloat(ingreso) : 0
        totalventa -= salida != null ? parseFloat(salida) : 0
        const { cuadre_ini, cuadre_fin, cuadre_total } = await CuadreIni(empresa, estado)
        console.log("ini:",cuadre_ini, "fin:",cuadre_fin, "total:",cuadre_total)
        if(cuadre_ini == 0){
            await Caja.create({fecha_cuadre, usuario, conteo_ini:conteo, cuadre_ini:venta, cuadre_total:totalventa, empresa})
            const actualiza = await Reporte.update({estado:"CUADRE"},{where:{empresa, fecha_creacion:fecha_cuadre}});
            res.json(actualiza);
        }else if(cuadre_ini != 0 && cuadre_fin == 0){
            totalventa += parseFloat(cuadre_ini)
            await Caja.update({conteo_fin:conteo, cuadre_fin:venta, cuadre_total:totalventa},{where:{empresa, fecha_cuadre}})
            const actualiza = await Reporte.update({estado:"CUADRE"},{where:{empresa, fecha_creacion:fecha_cuadre}});
            res.json(actualiza);
        }else if(cuadre_ini != 0 && cuadre_fin != 0){
            await Caja.create({fecha_cuadre, conteo_ini:conteo, usuario, cuadre_ini:venta, cuadre_total:totalventa, empresa})
            const actualiza = await Reporte.update({estado:"CUADRE"},{where:{empresa, fecha_creacion:fecha_cuadre}});
            res.json(actualiza);
        }
        // await Reporte.update({estado:"CUADRE"},{where:{empresa,fecha_creacion:fecha_cuadre}});
    } catch (error) {
        console.log("ListarReporte", error)
    }
}
async function TotalMovimientos(empresa,fecha,estado){
    return new Promise((resolve, reject) => {
        let sql = `SELECT sum(ingreso) AS ingreso, sum(salida) AS salida FROM esq_reporte.movimiento  WHERE empresa = '${empresa}' AND fecha = '${fecha}' AND estado = '${estado}'`;
        db.query(sql,{type: sequelize.QueryTypes.SELECT}).then((response)=>{
            if(!empty(response)){
                TotalMovimientosCambiarEstado(empresa,fecha)
                resolve(response[0])
            }else{
                resolve({ingreso:0, salida:0});
            }
        }).catch((err)=>{
            console.log("Error", err);
        })
    })
}
async function TotalMovimientosCambiarEstado(empresa,fecha){
    return new Promise((resolve, reject) => {
        let estado = "CUADRE"
        let sql = `UPDATE esq_reporte.movimiento SET estado = '${estado}' WHERE empresa = '${empresa}' AND fecha = '${fecha}'`;
        db.query(sql,{type: sequelize.QueryTypes.SELECT}).then((response)=>{
            console.log("acualiza movimiento", response);
        }).catch((err)=>{
            console.log("Error", err);
        })
    })
}
export async function CrearVenta(req, res) {
    const { empresa, tienda, secuencial, fecha } = req.body;
    var count = 0;
    for (var index = 0; index < tienda.length; index++) {
        Reporte.create({
            secuencia:secuencial,
            producto:tienda[index].producto,
            precio_venta:tienda[index].precio_venta,
            cantidad:tienda[index].cantidad,
            fecha_creacion:fecha,
            empresa,
        }) .then((response) => {
            count += 1
        }).catch((err) => {
            console.log(err);
        });
    }
    if(index === tienda.length){
        res.json({
            success:true,
            msg:'Se registro correctamente la Factura',
            items: "item registrado "+count
        })
    }else{
        console.log("error")
    }
}

export async function ActualizarEstado(req, res) {
    try {
        const { editar, forma_pago, estado } = req.body
        const { secuencia, empresa } = editar
        if(!empty(forma_pago) && !empty(estado)){
            const response = await Reporte.update({ estado, forma_pago }, { where: { secuencia, empresa } });
            console.log(response)
            if (!empty(response[0])) {
                res.json({
                    success: true,
                    data: response[0],
                    msg: 'reporte Actualizado'
                })
            }else{
                res.json({success: false, msg:"no se pudo actualizar"})
            }
        }else if(!empty(estado)){
            const response = await Reporte.update({ estado }, { where: { secuencia, empresa } });
            console.log(response)
            if (!empty(response[0])) {
                res.json({
                    success: true,
                    data: response[0],
                    msg: 'reporte Actualizado'
                })
            }else{
                res.json({success: false, msg:"no se pudo actualizar"})
            }
        }else if(!empty(forma_pago)){
            const response = await Reporte.update({ forma_pago }, { where: { secuencia, empresa } });
            console.log(response)
            if (!empty(response[0])) {
                res.json({
                    success: true,
                    data: response[0],
                    msg: 'reporte Actualizado'
                })
            }else{
                res.json({success: false, msg:"no se pudo actualizar"})
            }
        }

    } catch (error) {
        console.log("ActualizarEstado", error)
    }
}

export async function SacarTotalesVentaFechas(req, res) {
    try {
        const { empresa, fecha_ini, fecha_fin, estado } = req.body;
        let sql = `SELECT SUM(precio_venta * cantidad) AS tota_venta FROM esq_reporte.reporte WHERE empresa = '${empresa}' AND estado = '${estado}' AND fecha_creacion BETWEEN '${fecha_ini}' and '${fecha_fin}'`
        db.query(sql,{type: sequelize.QueryTypes.SELECT}).then((response)=>{
            console.log("SacarTotalesVentaFechas",response[0]);
            if(!empty(response)){
                res.json({
                    success: true,
                    data: response[0],
                    msg:'SacarTotalesVentaFechas',
                })
            }else{
                res.json({msg: "no se encontro reporte"})
            }
        }).catch((err)=>{
            console.log("Error", err);
        })
    } catch (error) {
        console.log("ListarReporte", error)
    }
}

export async function CuadreIni(empresa, estado){
    return new Promise((resolve, reject) => {
        let sql = `SELECT cuadre_ini, cuadre_fin, cuadre_total FROM esq_reporte.caja  WHERE empresa = '${empresa}' AND estado = '${estado}' ORDER BY id DESC LIMIT 1`;
        db.query(sql,{type: sequelize.QueryTypes.SELECT}).then((response)=>{
            if(!empty(response)){
                if(response[0].cuadre_ini != 'NaN' && response[0].cuadre_fin != 'NaN'){
                    resolve(response[0])
                }else{
                    resolve({cuadre_ini:0, cuadre_fin:0, cuadre_total:0}); 
                }
            }else{
                resolve({cuadre_ini:0, cuadre_fin:0, cuadre_total:0});
            }
        }).catch((err)=>{
            console.log("Error", err);
        })
    })
}


//movimiento de caja para 
export async function IngresarMovimiento(req, res) {
    try {
        const { detalle, usuario, empresa, ingreso, salida, fecha } = req.body
        const respuesta = await Movimiento.create({detalle, usuario, empresa, ingreso, salida, fecha})
        res.json(respuesta)
    } catch (error) {
        console.log("IngresarMovimiento",error)
    }
}