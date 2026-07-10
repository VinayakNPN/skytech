"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../config/db");
const router = (0, express_1.Router)();
// GET all orders
router.get('/', async (req, res, next) => {
    try {
        const orders = await db_1.prisma.order.findMany({
            include: {
                customer: true,
            },
        });
        res.json({
            status: 'success',
            data: orders,
        });
    }
    catch (error) {
        next(error);
    }
});
// GET order by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await db_1.prisma.order.findUnique({
            where: { id },
            include: {
                customer: true,
                tasks: {
                    include: {
                        assignee: true,
                    },
                },
            },
        });
        if (!order) {
            return res.status(404).json({
                status: 'fail',
                message: 'Order not found',
            });
        }
        res.json({
            status: 'success',
            data: order,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
