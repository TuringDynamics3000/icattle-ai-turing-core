#!/usr/bin/env python3
"""
Convert MySQL Drizzle schema to PostgreSQL schema
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
    
    # Collect all enum definitions
    enums = []
    enum_pattern = r'mysqlEnum\("(\w+)",\s*\[(.*?)\]\)'
    
    for match in re.finditer(enum_pattern, content, re.DOTALL):
        enum_name = match.group(1)
        enum_values = match.group(2)
        enums.append((enum_name, enum_values))
    
    # Create pgEnum definitions at the top
    enum_definitions = []
    for enum_name, enum_values in enums:
        # Clean up the enum values
        values = [v.strip() for v in enum_values.split(',')]
        enum_def = f'export const {enum_name}Enum = pgEnum("{enum_name}", [{", ".join(values)}]);'
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
    for enum_name, _ in enums:
        content = re.sub(
            rf'mysqlEnum\("{enum_name}",\s*\[.*?\]\)',
            f'{enum_name}Enum("{enum_name}")',
            content,
            flags=re.DOTALL
        )
    
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
    print(f"📊 Found {len(enums)} enums: {', '.join([e[0] for e in enums])}")

if __name__ == '__main__':
    convert_schema('drizzle/schema.ts', 'drizzle/schema.pg.ts')
