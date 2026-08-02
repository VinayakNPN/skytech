"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineLeaveRoutingRole = determineLeaveRoutingRole;
function determineLeaveRoutingRole(applicantRole) {
    switch (applicantRole) {
        case 'Manager':
            return 'Admin';
        case 'HR':
            return 'Manager';
        case 'Engineer':
        case 'Supervisor':
        case 'Operator':
        case 'Viewer':
        default:
            return 'HR';
    }
}
