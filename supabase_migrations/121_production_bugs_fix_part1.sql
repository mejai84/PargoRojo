/*
  CORRECCIONES CRÍTICAS DE PRODUCCIÓN - Parte 1
  Fecha: 27 de enero de 2026
  Bugs: #7, #10, #11 del reporte BUGS_PRODUCCION_2026_01_27.md
  VERSIÓN SINGLE-TENANT (Sin restaurant_id)
*/

-- ============================================================================
-- 1. AGREGAR OBSERVACIONES A ITEMS DE PEDIDO
-- ============================================================================
-- Bug #7: Falta campo para observaciones en productos

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE order_items 
        ADD COLUMN notes TEXT;
        
        COMMENT ON COLUMN order_items.notes IS 
        'Observaciones del cliente para este producto (ej: sin cebolla, término medio, extra salsa)';
    END IF;
END $$;

-- ============================================================================
-- 2. ASEGURAR ID DEL MESERO EN PEDIDOS
-- ============================================================================
-- Bug #10: Falta registro de qué mesero tomó el pedido

DO $$ 
BEGIN
    -- Verificar si existe la columna waiter_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'waiter_id'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN waiter_id UUID REFERENCES profiles(id);
        
        COMMENT ON COLUMN orders.waiter_id IS 
        'ID del mesero que tomó el pedido. Obligatorio para auditoría.';
    END IF;
    
    -- Crear índice para consultas rápidas por mesero
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_waiter'
    ) THEN
        CREATE INDEX idx_orders_waiter ON orders(waiter_id, created_at DESC);
    END IF;
END $$;

-- ============================================================================
-- 3. ASEGURAR TIMESTAMPS COMPLETOS EN TODAS LAS TABLAS
-- ============================================================================
-- Bug #11: Faltan timestamps completos (fecha + hora + segundo)

-- 3.1 Función para agregar timestamps automáticos
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3.2 Asegurar updated_at en orders
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'updated_at'
    ) THEN
        -- Si no existe, la agregamos
        ALTER TABLE orders 
        ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ELSE
        -- Si ya existe, aseguramos que tenga default
        ALTER TABLE orders 
        ALTER COLUMN updated_at SET DEFAULT NOW();
    END IF;
    
    -- Trigger de actualización automática
    DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
    CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END $$;

-- 3.3 Asegurar timestamps en order_items
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE order_items 
        ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE order_items 
        ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
    
    DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
    CREATE TRIGGER update_order_items_updated_at
        BEFORE UPDATE ON order_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END $$;

-- 3.4 Asegurar timestamps en payments (si existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payments' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE payments 
            ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        END IF;
        
        DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
        CREATE TRIGGER update_payments_updated_at
            BEFORE UPDATE ON payments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 3.5 Asegurar timestamps en cash_movements (si existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_movements') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'cash_movements' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE cash_movements 
            ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        END IF;
        
        DROP TRIGGER IF EXISTS update_cash_movements_updated_at ON cash_movements;
        CREATE TRIGGER update_cash_movements_updated_at
            BEFORE UPDATE ON cash_movements
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- 4. TABLA PARA COMPROBANTES (si no existe)
-- ============================================================================
-- Bug #2: Comprobantes no se guardan

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_name VARCHAR(255),
    customer_tax_id VARCHAR(50),
    subtotal NUMERIC(12, 2) NOT NULL,
    tax NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_receipts_order ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created ON receipts(created_at DESC);

-- Trigger
DROP TRIGGER IF EXISTS update_receipts_updated_at ON receipts;
CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE receipts IS 
'Comprobantes de venta generados. Registro de facturas/recibos emitidos.';

-- ============================================================================
-- 5. AUDITAR CAMBIOS DE MESA (si existe tabla tables)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tables') THEN
        -- Crear tabla para auditar transferencias entre mesas
        CREATE TABLE IF NOT EXISTS table_transfers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source_table_id UUID NOT NULL REFERENCES tables(id),
            target_table_id UUID NOT NULL REFERENCES tables(id),
            order_id UUID NOT NULL REFERENCES orders(id),
            transferred_by UUID NOT NULL REFERENCES profiles(id),
            reason TEXT,
            transferred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            
            CONSTRAINT different_tables CHECK (source_table_id != target_table_id)
        );

        CREATE INDEX IF NOT EXISTS idx_table_transfers_order 
        ON table_transfers(order_id);
        
        CREATE INDEX IF NOT EXISTS idx_table_transfers_date
        ON table_transfers(transferred_at DESC);

        COMMENT ON TABLE table_transfers IS 
        'Registro de transferencias de pedidos entre mesas. Auditoría completa de movimientos.';
    END IF;
END $$;

-- ============================================================================
-- 6. FUNCIÓN PARA TRANSFERIR PEDIDO ENTRE MESAS
-- ============================================================================
-- Bug #6: No funciona mover productos entre mesas

CREATE OR REPLACE FUNCTION transfer_order_to_table(
    p_order_id UUID,
    p_target_table_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_source_table_id UUID;
    v_existing_order UUID;
BEGIN
    -- 1. Verificar que exista la tabla tables
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tables') THEN
        RAISE EXCEPTION 'La funcionalidad de mesas no está disponible';
    END IF;

    -- 2. Obtener orden actual
    SELECT o.*, o.table_id
    INTO v_order
    FROM orders o
    WHERE o.id = p_order_id;
    
    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Orden no encontrada';
    END IF;
    
    v_source_table_id := v_order.table_id;
    
    IF v_source_table_id = p_target_table_id THEN
        RAISE EXCEPTION 'La mesa de origen y destino son la misma';
    END IF;
    
    -- 3. Verificar si la mesa destino ya tiene una orden activa
    SELECT id INTO v_existing_order
    FROM orders
    WHERE table_id = p_target_table_id
      AND status NOT IN ('delivered', 'cancelled', 'paid')
    LIMIT 1;
    
    -- 4. Si hay orden activa en destino, SUMAR items (no reemplazar)
    IF v_existing_order IS NOT NULL THEN
        -- Transferir todos los items a la orden existente
        UPDATE order_items
        SET order_id = v_existing_order,
            updated_at = NOW()
        WHERE order_id = p_order_id;
        
        -- Recalcular total de la orden destino
        UPDATE orders
        SET subtotal = (
                SELECT COALESCE(SUM(unit_price * quantity), 0)
                FROM order_items
                WHERE order_id = v_existing_order
            ),
            total = (
                SELECT COALESCE(SUM(unit_price * quantity), 0)
                FROM order_items
                WHERE order_id = v_existing_order
            ),
            updated_at = NOW()
        WHERE id = v_existing_order;
        
        -- Cancelar la orden origen (ya no tiene items)
        UPDATE orders
        SET status = 'cancelled',
            updated_at = NOW()
        WHERE id = p_order_id;
        
    ELSE
        -- 5. Si no hay orden en destino, simplemente cambiar de mesa
        UPDATE orders
        SET table_id = p_target_table_id,
            updated_at = NOW()
        WHERE id = p_order_id;
    END IF;
    
    -- 6. Registrar auditoría de transferencia (si existe tabla)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'table_transfers') THEN
        INSERT INTO table_transfers (
            source_table_id,
            target_table_id,
            order_id,
            transferred_by,
            reason
        ) VALUES (
            v_source_table_id,
            p_target_table_id,
            p_order_id,
            p_user_id,
            p_reason
        );
    END IF;
    
    -- 7. Auditoría general (si existe tabla)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            metadata
        ) VALUES (
            p_user_id,
            'TABLE_TRANSFER',
            'order',
            p_order_id,
            jsonb_build_object(
                'source_table_id', v_source_table_id,
                'target_table_id', p_target_table_id,
                'reason', p_reason,
                'merged_into', v_existing_order
            )
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Pedido transferido exitosamente',
        'merged', v_existing_order IS NOT NULL,
        'target_order_id', COALESCE(v_existing_order, p_order_id)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al transferir pedido: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

COMMENT ON FUNCTION transfer_order_to_table IS 
'Transfiere un pedido de una mesa a otra. Si la mesa destino tiene pedido activo, SUMA los items (no reemplaza). Audita completamente el movimiento.';

/*
  FIN DE MIGRACIÓN 121 - SINGLE TENANT
  Correcciones implementadas:
  - Observaciones en productos (order_items.notes)
  - ID del mesero en pedidos (orders.waiter_id)
  - Timestamps completos en todas las tablas transaccionales
  - Tabla de comprobantes (receipts)
  - Función de transferencia entre mesas (transfer_order_to_table)
  - Auditoría completa de movimientos
*/
