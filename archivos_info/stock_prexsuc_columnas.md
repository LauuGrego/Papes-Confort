# Reporte de Inspección: stock_prexsuc

Fecha: 2026-10-27 19:10:06
- Host: `localhost:3306`
- Base de Datos: `agc_sql_datosges`

---

## Tabla encontrada: `stock_prexsuc`

- Motor: `InnoDB`
- Filas estimadas: `4`

### Columnas de `stock_prexsuc`

| Pos | Columna | Tipo | Nulo | Clave | Defecto | Comentario |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | KeyID | bigint(20) | NO | PRI | NULL |  |
| 2 | PART | varchar(7) | YES | MUL | NULL |  |
| 3 | PSUC | varchar(2) | YES |  | NULL |  |
| 4 | PPARTE | varchar(9) | YES | MUL | NULL |  |
| 5 | PDESDE | date | YES | MUL | NULL |  |
| 6 | PHASTA | date | YES | MUL | NULL |  |
| 7 | PHORDES | varchar(8) | YES |  | NULL |  |
| 8 | PHORHAS | varchar(8) | YES |  | NULL |  |
| 9 | PPRECIO | decimal(18,2) | YES |  | NULL |  |
| 10 | PLUN | decimal(12,2) | YES |  | NULL |  |
| 11 | PMAR | decimal(12,2) | YES |  | NULL |  |
| 12 | PMIE | decimal(12,2) | YES |  | NULL |  |
| 13 | PJUE | decimal(12,2) | YES |  | NULL |  |
| 14 | PVIE | decimal(12,2) | YES |  | NULL |  |
| 15 | PSAB | decimal(12,2) | YES |  | NULL |  |
| 16 | PDOM | decimal(12,2) | YES |  | NULL |  |
| 17 | PHORA | varchar(5) | YES |  | NULL |  |
| 18 | PIDOL | varchar(2) | YES |  | NULL |  |
| 19 | PUCOD | varchar(8) | YES | UNI | NULL |  |
| 20 | PLIS | varchar(2) | YES |  | NULL |  |
| 21 | PPRELIS | decimal(18,2) | YES |  | NULL |  |

### Muestra de datos (primeros 5 registros)

| KeyID | PART | PSUC | PPARTE | PDESDE | PHASTA | PHORDES | PHORHAS | PPRECIO | PLUN | PMAR | PMIE | PJUE | PVIE | PSAB | PDOM | PHORA | PIDOL | PUCOD | PLIS | PPRELIS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0153044 | BO | 202609020 | Wed Sep 02 2026 00:00:00 GMT-0300 (GMT-03:00) | Sat Sep 12 2026 00:00:00 GMT-0300 (GMT-03:00) | 16:50:49 | 16:50:49 | 53900.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 18:57 | 02 | 02   $ýB | 01 | 74900.00 |
| 4 | 0153044 | BO | 202609020 | Wed Sep 02 2026 00:00:00 GMT-0300 (GMT-03:00) | Wed Sep 02 2026 00:00:00 GMT-0300 (GMT-03:00) | 18:57:23 | 18:57:23 | 53900.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 19:02 | 02 | 02   $ýD | 01 | 45000.00 |
| 6 | 0153044 | 01 | 202609030 | Thu Sep 03 2026 00:00:00 GMT-0300 (GMT-03:00) | Thu Sep 03 2026 00:00:00 GMT-0300 (GMT-03:00) | 07:00:00 | 23:00:00 | 53900.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 16:33 | 02 | 02   $ýM | 01 | 67400.00 |
| 7 | 0152945 | 01 | 202610160 | Fri Oct 16 2026 00:00:00 GMT-0300 (GMT-03:00) | Sat Oct 31 2026 00:00:00 GMT-0300 (GMT-03:00) | 17:21:57 | 12:30:00 | 186000.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 17:23 | 02 | 02   %(Ó |    | 152.00 |

