const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const inputFilePath = path.join(__dirname, 'data', 'COLUMNS_202407150915.csv');
const outputDir = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Function to map data types
function mapDataType(type) {
    const typeMapping = {
        'tinyint': 'Byte',
        'smallint': 'Short',
        'mediumint': 'Integer',
        'int': 'Integer',
        'bigint auto_increment': 'Long',
        'bigint': 'Long',
        'float': 'Float',
        'double': 'Double',
        'decimal': 'BigDecimal',
        'date': 'Date',
        'datetime': 'Timestamp',
        'timestamp': 'Timestamp',
        'time': 'Time',
        'year': 'Year',
        'char': 'String',
        'varchar': 'String',
        'binary': 'byte[]',
        'varbinary': 'byte[]',
        'tinyblob': 'byte[]',
        'blob': 'byte[]',
        'mediumblob': 'byte[]',
        'longblob': 'byte[]',
        'tinytext': 'String',
        'text': 'String',
        'mediumtext': 'String',
        'longtext': 'String',
        'enum': 'String',
        'set': 'Set<String>',
        'geometry': 'Object',
        'point': 'Object',
        'linestring': 'Object',
        'polygon': 'Object',
        'multipoint': 'Object',
        'multilinestring': 'Object',
        'multipolygon': 'Object',
        'geometrycollection': 'Object',
        'geomcollection': 'Object'
    };
    return typeMapping[type.toLowerCase()] || type.toLowerCase();  // Return the mapped type or the original type if no mapping exists
}

// Function to capitalize the first letter and make the rest lowercase
function capitalizeFirstLetterOnly(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Function to capitalize the first letter
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Function to get database configuration based on the selected database type
function getDatabaseConfig(dbType) {
    const configs = {
        'H2': {
            username: "sa",
            password: "",
            platform: "org.hibernate.dialect.H2Dialect",
            driverClassName: "org.h2.Driver",
            host: "jdbc:h2:mem:testdb"
        },
        'MySQL': {
            username: "root",
            password: "admin123",
            platform: "org.hibernate.dialect.MySQL8Dialect",
            driverClassName: "com.mysql.cj.jdbc.Driver",
            host: "jdbc:mysql://localhost:6603/sports"
        },
        'Oracle': {
            username: "system",
            password: "",
            platform: "org.hibernate.dialect.Oracle12cDialect",
            driverClassName: "oracle.jdbc.OracleDriver",
            host: "jdbc:oracle:thin:@localhost:1521:orcl"
        },
        'MongoDB': {
            username: "",
            password: "",
            platform: "org.springframework.data.mongodb.core.mapping.MongoMappingContext",
            driverClassName: "",
            host: "mongodb://localhost:27017/testdb"
        }
    };
    return configs[dbType];
}

const dbType = 'MySQL'; // Change this to 'H2', 'Oracle', or 'MongoDB' as needed
const databaseConfig = getDatabaseConfig(dbType);

const results = {};

fs.createReadStream(inputFilePath)
    .pipe(csv())
    .on('data', (data) => {
        const tableName = data['table_name'];
        if (!results[tableName]) {
            results[tableName] = [];
        }
        results[tableName].push({
            type: mapDataType(data['data_type']),
            name: data['column_name'],
            nameEntity: data['column_name'],
            isPrimaryKey: data['is_primary_key'] === 'yes' ? 'Y' : 'N',
            isNotNull: data['is_primary_key'] === 'yes' ? 'Y' : 'N',
            columnName: data['column_name']
        });
    })
    .on('end', () => {
        Object.keys(results).forEach(tableName => {
            const projectNameOut = `${tableName}`.toLowerCase();
            const projectName = `${tableName}-q`.toLowerCase();
            const capitalizedTableName = capitalizeFirstLetter(projectNameOut);
            const entityName = capitalizeFirstLetterOnly(tableName);
            const jsonStructure = {
                projectName: projectName,
                username: "xxxx",
                newBranchName: "feature/XXXXX",
                targetDirectory: projectName,
                packageName: `com.fernandez.${projectNameOut}`,
                appClassName: `${capitalizedTableName}Application`,
                entityName: entityName,
                repositoryName: `${entityName}Repository`,
                serviceName: `${entityName}Service`,
                controllerName: `${entityName}Controller`,
                exceptionName: "ResourceNotFoundException",
                exceptionNameBadRequest: "BadRequestException",
                handlerName: "GlobalExceptionHandler",
                dtoName: `${entityName}Dto`,
                mapperName: `${entityName}Mapper`,
                entityFields: results[tableName],
                tableName: tableName,
                urlName: tableName.toLowerCase(),
                findByKeys: "find",
                search: "search",
                databaseConfig: databaseConfig
            };
            const filePath = path.join(outputDir, `${tableName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(jsonStructure, null, 2));
        });
        console.log('JSON files have been generated in the output directory.');
    });
