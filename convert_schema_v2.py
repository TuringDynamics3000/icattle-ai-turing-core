#!/usr/bin/env python3
"""
Convert MySQL Drizzle schema to PostgreSQL schema
Handles duplicate enum names by tracking context
"""

import re

def convert_schema(input_file, output_file):
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Replace imports
    content = content.replace(
        'import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";',
        'import { integer, pgEnum, pgTable, text, timestamp, varchar, decimal, boolean, index, serial } from "drizzle-orm/pg-core";'
    )
    
    # Collect all enum definitions with their context (table name)
    enums = {}  # {(table_name, field_name): (enum_name, enum_values)}
    
    # Find all table definitions
    table_pattern = r'export const (\w+) = mysqlTable\("(\w+)", \{(.*?)\}, \(table\)'
    
    for table_match in re.finditer(table_pattern, content, re.DOTALL):
        table_var_name = table_match.group(1)
        table_name = table_match.group(2)
        table_body = table_match.group(3)
        
        # Find enums within this table
        enum_pattern = r'(\w+):\s*mysqlEnum\("(\w+)",\s*\[(.*?)\]\)'
        for enum_match in re.finditer(enum_pattern, table_body, re.DOTALL):
            field_name = enum_match.group(1)
            enum_name = enum_match.group(2)
            enum_values = enum_match.group(3)
            
            # Create unique key
            key = (table_name, field_name, enum_name)
            if key not in enums:
                enums[key] = enum_values
    
    # Create unique enum names
    enum_definitions = []
    enum_mapping = {}  # {(table_name, field_name, enum_name): unique_enum_name}
    enum_names_used = set()
    
    for (table_name, field_name, enum_name), enum_values in enums.items():
        # Try to create a unique name
        if enum_name not in enum_names_used:
            unique_name = enum_name
        else:
            # Add table prefix for disambiguation
            unique_name = f"{table_name}_{enum_name}"
        
        enum_names_used.add(unique_name)
        enum_mapping[(table_name, field_name, enum_name)] = unique_name
        
        # Clean up the enum values
        values = [v.strip() for v in enum_values.split(',')]
        enum_def = f'export const {unique_name}Enum = pgEnum("{enum_name}", [{", ".join(values)}]);'
        enum_definitions.append(enum_def)
    
    # Insert enum definitions after imports
    import_end = content.find('/**')
    if import_end != -1:
        enum_section = '\n// ============================================================================\n// ENUMS\n// ============================================================================\n\n' + '\n'.join(enum_definitions) + '\n\n'
        content = content[:import_end] + enum_section + content[import_end:]
    
    # Replace mysqlTable with pgTable
    content = content.replace('mysqlTable(', 'pgTable(')
    
    # Replace int with integer
    content = re.sub(r'\bint\(', 'integer(', content)
    
    # Replace autoincrement with serial
    content = re.sub(r'integer\("id"\)\.autoincrement\(\)\.primaryKey\(\)', 'serial("id").primaryKey()', content)
    
    # Replace mysqlEnum with the enum reference
    # Need to do this carefully to use the right enum name
    for table_match in re.finditer(table_pattern, content, re.DOTALL):
        table_var_name = table_match.group(1)
        table_name = table_match.group(2)
        table_body = table_match.group(3)
        
        # Find enums within this table and replace them
        enum_pattern = r'(\w+):\s*mysqlEnum\("(\w+)",\s*\[(.*?)\]\)'
        
        def replace_enum(match):
            field_name = match.group(1)
            enum_name = match.group(2)
            
            # Find the unique enum name
            key = (table_name, field_name, enum_name)
            if key in enum_mapping:
                unique_enum_name = enum_mapping[key]
                return f'{field_name}: {unique_enum_name}Enum("{enum_name}")'
            return match.group(0)
        
        new_table_body = re.sub(enum_pattern, replace_enum, table_body, flags=re.DOTALL)
        content = content.replace(table_body, new_table_body)
    
    # Remove onUpdateNow() as PostgreSQL doesn't support it natively
    content = re.sub(r'\.onUpdateNow\(\)', '', content)
    
    # Add comment about onUpdateNow removal
    content = content.replace(
        '// USERS & AUTHENTICATION',
        '// USERS & AUTHENTICATION\n// Note: PostgreSQL does not support onUpdateNow(). Use triggers or application logic for auto-update.'
    )
    
    with open(output_file, 'w') as f:
        f.write(content)
    
    print(f"✅ Converted schema written to {output_file}")
    print(f"📊 Found {len(enums)} enum fields across tables")
    print(f"📝 Created {len(enum_definitions)} unique enum definitions")

if __name__ == '__main__':
    convert_schema('drizzle/schema.ts', 'drizzle/schema.pg.ts')
