import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test database schema for quotes management system
describe('Quotes Database Schema', () => {
  let supabase: any
  
  beforeAll(async () => {
    // Initialize Supabase client for testing
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  describe('quotes table', () => {
    it('should have correct table structure', async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .limit(0)
      
      // Test will fail initially - this drives the schema creation
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have required columns with correct types', async () => {
      // Test for all required columns in quotes table
      const { data: columns } = await supabase
        .rpc('get_table_columns', { table_name: 'quotes' })
      
      const expectedColumns = [
        { name: 'id', type: 'bigint', nullable: false },
        { name: 'quote_number', type: 'text', nullable: false },
        { name: 'customer_account_id', type: 'bigint', nullable: false },
        { name: 'assigned_sales_rep_id', type: 'bigint', nullable: false },
        { name: 'quote_status', type: 'text', nullable: false },
        { name: 'total_equipment_cost', type: 'numeric', nullable: true },
        { name: 'total_labor_cost', type: 'numeric', nullable: true },
        { name: 'total_customer_price', type: 'numeric', nullable: true },
        { name: 'gross_profit_margin', type: 'numeric', nullable: true },
        { name: 'expiration_date', type: 'date', nullable: true },
        { name: 'scope_of_work', type: 'text', nullable: true },
        { name: 'internal_notes', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp with time zone', nullable: false },
        { name: 'updated_at', type: 'timestamp with time zone', nullable: false }
      ]

      expectedColumns.forEach(expectedCol => {
        const actualCol = columns?.find((col: any) => col.column_name === expectedCol.name)
        expect(actualCol, `Column ${expectedCol.name} should exist`).toBeDefined()
        expect(actualCol?.data_type).toContain(expectedCol.type)
        expect(actualCol?.is_nullable).toBe(expectedCol.nullable ? 'YES' : 'NO')
      })
    })

    it('should have quote_number unique constraint', async () => {
      const { data: constraints } = await supabase
        .rpc('get_table_constraints', { table_name: 'quotes' })
      
      const uniqueConstraint = constraints?.find((c: any) => 
        c.constraint_type === 'UNIQUE' && c.column_name === 'quote_number'
      )
      expect(uniqueConstraint).toBeDefined()
    })

    it('should have quote_status check constraint', async () => {
      const { data: constraints } = await supabase
        .rpc('get_table_constraints', { table_name: 'quotes' })
      
      const statusConstraint = constraints?.find((c: any) => 
        c.constraint_type === 'CHECK' && c.constraint_name.includes('quote_status')
      )
      expect(statusConstraint).toBeDefined()
    })

    it('should have foreign key to customer_accounts', async () => {
      const { data: foreignKeys } = await supabase
        .rpc('get_foreign_keys', { table_name: 'quotes' })
      
      const customerFk = foreignKeys?.find((fk: any) => 
        fk.column_name === 'customer_account_id' && 
        fk.foreign_table_name === 'customer_accounts'
      )
      expect(customerFk).toBeDefined()
    })

    it('should have proper indexes for performance', async () => {
      const { data: indexes } = await supabase
        .rpc('get_table_indexes', { table_name: 'quotes' })
      
      // Check for essential indexes
      const expectedIndexes = [
        'idx_quotes_quote_number',
        'idx_quotes_customer_account_id', 
        'idx_quotes_sales_rep_id',
        'idx_quotes_status',
        'idx_quotes_created_at'
      ]

      expectedIndexes.forEach(indexName => {
        const index = indexes?.find((idx: any) => idx.indexname === indexName)
        expect(index, `Index ${indexName} should exist`).toBeDefined()
      })
    })
  })

  describe('quote_options table', () => {
    it('should have correct table structure', async () => {
      const { data, error } = await supabase
        .from('quote_options')
        .select('*')
        .limit(0)
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have required columns', async () => {
      const { data: columns } = await supabase
        .rpc('get_table_columns', { table_name: 'quote_options' })
      
      const expectedColumns = [
        'id', 'quote_id', 'option_name', 'option_description', 
        'total_equipment_cost', 'total_labor_cost', 'total_customer_price',
        'is_selected', 'created_at', 'updated_at'
      ]

      expectedColumns.forEach(colName => {
        const column = columns?.find((col: any) => col.column_name === colName)
        expect(column, `Column ${colName} should exist`).toBeDefined()
      })
    })

    it('should have foreign key to quotes', async () => {
      const { data: foreignKeys } = await supabase
        .rpc('get_foreign_keys', { table_name: 'quote_options' })
      
      const quoteFk = foreignKeys?.find((fk: any) => 
        fk.column_name === 'quote_id' && 
        fk.foreign_table_name === 'quotes'
      )
      expect(quoteFk).toBeDefined()
    })
  })

  describe('quote_areas table', () => {
    it('should have correct table structure', async () => {
      const { data, error } = await supabase
        .from('quote_areas')
        .select('*')
        .limit(0)
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have required columns', async () => {
      const { data: columns } = await supabase
        .rpc('get_table_columns', { table_name: 'quote_areas' })
      
      const expectedColumns = [
        'id', 'quote_id', 'area_name', 'area_description', 
        'display_order', 'created_at', 'updated_at'
      ]

      expectedColumns.forEach(colName => {
        const column = columns?.find((col: any) => col.column_name === colName)
        expect(column, `Column ${colName} should exist`).toBeDefined()
      })
    })
  })

  describe('quote_equipment table', () => {
    it('should have correct table structure', async () => {
      const { data, error } = await supabase
        .from('quote_equipment')
        .select('*')
        .limit(0)
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have required columns', async () => {
      const { data: columns } = await supabase
        .rpc('get_table_columns', { table_name: 'quote_equipment' })
      
      const expectedColumns = [
        'id', 'quote_id', 'quote_area_id', 'product_id', 'quantity',
        'unit_cost', 'unit_price', 'line_total', 'equipment_notes',
        'created_at', 'updated_at'
      ]

      expectedColumns.forEach(colName => {
        const column = columns?.find((col: any) => col.column_name === colName)
        expect(column, `Column ${colName} should exist`).toBeDefined()
      })
    })

    it('should have foreign keys to quotes, quote_areas, and products', async () => {
      const { data: foreignKeys } = await supabase
        .rpc('get_foreign_keys', { table_name: 'quote_equipment' })
      
      const expectedForeignKeys = [
        { column: 'quote_id', table: 'quotes' },
        { column: 'quote_area_id', table: 'quote_areas' },
        { column: 'product_id', table: 'products' }
      ]

      expectedForeignKeys.forEach(expectedFk => {
        const fk = foreignKeys?.find((fk: any) => 
          fk.column_name === expectedFk.column && 
          fk.foreign_table_name === expectedFk.table
        )
        expect(fk, `Foreign key ${expectedFk.column} -> ${expectedFk.table} should exist`).toBeDefined()
      })
    })
  })

  describe('quote_labor table', () => {
    it('should have correct table structure', async () => {
      const { data, error } = await supabase
        .from('quote_labor')
        .select('*')
        .limit(0)
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have required columns', async () => {
      const { data: columns } = await supabase
        .rpc('get_table_columns', { table_name: 'quote_labor' })
      
      const expectedColumns = [
        'id', 'quote_id', 'labor_type', 'technician_id', 'subcontractor_id',
        'hours_estimated', 'hourly_rate', 'day_rate', 'total_cost',
        'customer_price', 'labor_notes', 'created_at', 'updated_at'
      ]

      expectedColumns.forEach(colName => {
        const column = columns?.find((col: any) => col.column_name === colName)
        expect(column, `Column ${colName} should exist`).toBeDefined()
      })
    })
  })

  describe('technicians table', () => {
    it('should have correct table structure', async () => {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .limit(0)
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have required columns', async () => {
      const { data: columns } = await supabase
        .rpc('get_table_columns', { table_name: 'technicians' })
      
      const expectedColumns = [
        'id', 'name', 'hourly_rate', 'specializations', 'is_active',
        'created_at', 'updated_at'
      ]

      expectedColumns.forEach(colName => {
        const column = columns?.find((col: any) => col.column_name === colName)
        expect(column, `Column ${colName} should exist`).toBeDefined()
      })
    })
  })

  describe('subcontractors table', () => {
    it('should have correct table structure', async () => {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .limit(0)
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have required columns', async () => {
      const { data: columns } = await supabase
        .rpc('get_table_columns', { table_name: 'subcontractors' })
      
      const expectedColumns = [
        'id', 'company_name', 'contact_name', 'email', 'phone',
        'day_rate', 'specializations', 'is_active', 'created_at', 'updated_at'
      ]

      expectedColumns.forEach(colName => {
        const column = columns?.find((col: any) => col.column_name === colName)
        expect(column, `Column ${colName} should exist`).toBeDefined()
      })
    })
  })

  describe('Database Helper Functions', () => {
    beforeEach(async () => {
      // Create helper functions for testing if they don't exist
      await supabase.rpc('create_test_helper_functions')
    })

    it('should have helper function for table columns', async () => {
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'customer_accounts' })
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have helper function for constraints', async () => {
      const { data, error } = await supabase
        .rpc('get_table_constraints', { table_name: 'customer_accounts' })
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have helper function for foreign keys', async () => {
      const { data, error } = await supabase
        .rpc('get_foreign_keys', { table_name: 'customer_accounts' })
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have helper function for indexes', async () => {
      const { data, error } = await supabase
        .rpc('get_table_indexes', { table_name: 'customer_accounts' })
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })
})
