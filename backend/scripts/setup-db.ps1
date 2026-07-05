param(
    [string]$PostgresUser = "postgres",
    [Parameter(Mandatory = $true)]
    [string]$PostgresPassword,
    [string]$AppUser = "datara",
    [string]$AppPassword = "datara",
    [string]$Database = "datara",
    [string]$Host = "localhost",
    [int]$Port = 5432
)

$ErrorActionPreference = "Stop"

$psql = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter psql.exe -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending |
    Select-Object -First 1 -ExpandProperty FullName

if (-not $psql) {
    throw "psql.exe was not found. Install PostgreSQL or use Docker: docker compose up -d postgres"
}

$env:PGPASSWORD = $PostgresPassword

Write-Host "Creating PostgreSQL user '$AppUser' and database '$Database'..."

& $psql -U $PostgresUser -h $Host -p $Port -d postgres -v ON_ERROR_STOP=1 -c @"
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$AppUser') THEN
        CREATE USER $AppUser WITH PASSWORD '$AppPassword';
    ELSE
        ALTER USER $AppUser WITH PASSWORD '$AppPassword';
    END IF;
END
`$`$;
"@

$dbExists = & $psql -U $PostgresUser -h $Host -p $Port -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$Database'"
if ($dbExists.Trim() -ne "1") {
    & $psql -U $PostgresUser -h $Host -p $Port -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $Database OWNER $AppUser;"
}

& $psql -U $PostgresUser -h $Host -p $Port -d postgres -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE $Database TO $AppUser;"

Write-Host "Done. Start the backend with PostgreSQL using:"
Write-Host "  `$env:SPRING_PROFILES_ACTIVE='prod'"
Write-Host "  mvn spring-boot:run"
