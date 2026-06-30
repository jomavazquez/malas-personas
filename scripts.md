# See tables:
 
Schema |        Name        | Type  | Owner 
-------+--------------------+-------+-------
public | cards              | table | malas
public | decks              | table | malas
public | rooms              | table | malas
public | users              | table | malas

docker exec -it malas-personas-db psql -U malas -d malas_personas -c "\dt"

# See one table:

docker exec -it malas-personas-db psql -U malas -d malas_personas -c "SELECT * FROM users;"

# Truncate a table:

docker exec -it malas-personas-db psql -U malas -d malas_personas -c "TRUNCATE rooms RESTART IDENTITY CASCADE;"

# Seed the database 

npx prisma generate
npm run db:seed