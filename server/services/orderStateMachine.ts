import type { Order } from "@shared/schema";

export type OrderStatus = "pending" | "processing" | "delivering" | "delivered" | "cancelled" | "disputed";
export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";
export type UserRole = "super_admin" | "admin" | "seller" | "buyer" | "rider" | "agent";

export interface TransitionContext {
  order: Order;
  targetStatus: OrderStatus;
  actorId: string;
  actorRole: UserRole;
  reason?: string;
}

export interface TransitionRule {
  allowedRoles: UserRole[];
  preconditions: Array<(ctx: TransitionContext) => { valid: boolean; error?: string }>;
  sideEffects?: Array<(order: Order) => Partial<Order>>;
}

export interface TransitionError {
  code: "invalid_transition" | "role_violation" | "precondition_failed" | "payment_required";
  message: string;
  details?: Record<string, any>;
}

// Define the state machine: current status → allowed transitions
const TRANSITION_RULES: Record<OrderStatus, Partial<Record<OrderStatus, TransitionRule>>> = {
  pending: {
    processing: {
      allowedRoles: ["seller", "admin", "super_admin"],
      preconditions: [
        (ctx) => ({
          valid: ctx.order.paymentStatus === "completed",
          error: "Payment must be completed before processing order"
        })
      ],
      sideEffects: []
    },
    cancelled: {
      allowedRoles: ["buyer", "seller", "admin", "super_admin"],
      preconditions: [],
      sideEffects: []
    }
  },

  processing: {
    delivering: {
      allowedRoles: ["admin", "super_admin"],
      preconditions: [
        (ctx) => ({
          valid: !!ctx.order.riderId,
          error: "Rider must be assigned before delivery can begin"
        }),
        (ctx) => ({
          valid: ctx.order.paymentStatus === "completed",
          error: "Payment must be completed before delivery"
        })
      ],
      sideEffects: []
    },
    cancelled: {
      allowedRoles: ["seller", "admin", "super_admin"],
      preconditions: [],
      sideEffects: [
        (order) => ({ riderId: null }) // Clear rider assignment
      ]
    },
    disputed: {
      allowedRoles: ["buyer", "admin", "super_admin"],
      preconditions: [],
      sideEffects: []
    }
  },

  delivering: {
    delivered: {
      allowedRoles: ["rider", "admin", "super_admin"],
      preconditions: [
        (ctx) => {
          // If actor is a rider, must be the assigned rider
          if (ctx.actorRole === "rider") {
            return {
              valid: ctx.order.riderId === ctx.actorId,
              error: "Only the assigned rider can mark this order as delivered"
            };
          }
          return { valid: true };
        }
      ],
      sideEffects: [
        (order) => ({ deliveredAt: new Date() })
      ]
    },
    cancelled: {
      allowedRoles: ["admin", "super_admin"],
      preconditions: [],
      sideEffects: [
        (order) => ({ riderId: null })
      ]
    },
    disputed: {
      allowedRoles: ["buyer", "admin", "super_admin"],
      preconditions: [],
      sideEffects: []
    }
  },

  delivered: {
    disputed: {
      allowedRoles: ["buyer", "admin", "super_admin"],
      preconditions: [],
      sideEffects: []
    }
  },

  cancelled: {
    // Cancelled orders cannot transition to other states
  },

  disputed: {
    delivered: {
      allowedRoles: ["admin", "super_admin"],
      preconditions: [
        (ctx) => ({
          valid: !!ctx.reason,
          error: "Reason required to resolve dispute and mark as delivered"
        })
      ],
      sideEffects: []
    },
    cancelled: {
      allowedRoles: ["admin", "super_admin"],
      preconditions: [
        (ctx) => ({
          valid: !!ctx.reason,
          error: "Reason required to resolve dispute and cancel order"
        })
      ],
      sideEffects: []
    }
  }
};

/**
 * Get all allowed target statuses for an order given the actor's role
 */
export function getAllowedTransitions(order: Order, actorRole: UserRole): OrderStatus[] {
  const currentStatus = order.status as OrderStatus;
  const transitions = TRANSITION_RULES[currentStatus] || {};
  
  return Object.entries(transitions)
    .filter(([_, rule]) => rule.allowedRoles.includes(actorRole))
    .map(([status]) => status as OrderStatus);
}

/**
 * Validate if a transition is allowed and return error details if not
 */
export function assertCanTransition(ctx: TransitionContext): { valid: true } | { valid: false; error: TransitionError } {
  const currentStatus = ctx.order.status as OrderStatus;
  
  // Check if transition exists in state machine
  const transitions = TRANSITION_RULES[currentStatus];
  if (!transitions || !transitions[ctx.targetStatus]) {
    return {
      valid: false,
      error: {
        code: "invalid_transition",
        message: `Cannot transition from ${currentStatus} to ${ctx.targetStatus}`,
        details: { currentStatus, targetStatus: ctx.targetStatus }
      }
    };
  }
  
  const rule = transitions[ctx.targetStatus]!;
  
  // Check role permission
  if (!rule.allowedRoles.includes(ctx.actorRole)) {
    return {
      valid: false,
      error: {
        code: "role_violation",
        message: `Role ${ctx.actorRole} is not permitted to transition order from ${currentStatus} to ${ctx.targetStatus}`,
        details: {
          currentStatus,
          targetStatus: ctx.targetStatus,
          actorRole: ctx.actorRole,
          allowedRoles: rule.allowedRoles
        }
      }
    };
  }
  
  // Check all preconditions
  for (const precondition of rule.preconditions) {
    const result = precondition(ctx);
    if (!result.valid) {
      return {
        valid: false,
        error: {
          code: "precondition_failed",
          message: result.error || "Precondition not met",
          details: { currentStatus, targetStatus: ctx.targetStatus }
        }
      };
    }
  }
  
  return { valid: true };
}

/**
 * Apply side effects for a transition
 */
export function getTransitionSideEffects(order: Order, targetStatus: OrderStatus): Partial<Order> {
  const currentStatus = order.status as OrderStatus;
  const transitions = TRANSITION_RULES[currentStatus];
  
  if (!transitions || !transitions[targetStatus]) {
    return {};
  }
  
  const rule = transitions[targetStatus]!;
  const sideEffects = rule.sideEffects || [];
  
  // Merge all side effects
  return sideEffects.reduce((acc, effect) => ({
    ...acc,
    ...effect(order)
  }), {});
}
