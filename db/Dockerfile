FROM postgres:latest

# Create the user and grant privileges
RUN apt-get update 
# RUN service postgresql status && service postgresql start
# RUN postgres -U psql -c "CREATE USER "$POSTGRES_USER" WITH PASSWORD '"$POSTGRES_USER"';"
# RUN postgres -U psql -c "GRANT ALL PRIVILEGES ON DATABASE "$POSTGRES_DB" TO "$POSTGRES_USER";"
# RUN postgres -U psql -c "ALTER USER "$POSTGRES_USER" WITH SUPERUSER;"
RUN service postgresql status
RUN   psql -c "CREATE USER oidboufk WITH PASSWORD 'oidboufk';"
# Expose the PostgreSQL port
EXPOSE 5432

# Entrypoint for starting PostgreSQL
# ENTRYPOINT ["sh", "script.sh"]
# Command for running the service
CMD ["postgres"]

