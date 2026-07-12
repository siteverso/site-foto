-- Patch incremental: remove objetos temporários criados indevidamente para mensagens de foto.
-- Usa MURM_POST como fonte única para posts públicos e privados relacionados a fotos.
-- Este patch NÃO recria objetos existentes e pode ser executado mesmo se parte da limpeza já ocorreu.

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*)
      INTO v_count
      FROM user_tables
     WHERE table_name = 'MURM_PHOTO_PRIVATE_MESSAGE';

    IF v_count > 0 THEN
        EXECUTE IMMEDIATE 'DROP TABLE MURM_PHOTO_PRIVATE_MESSAGE CASCADE CONSTRAINTS PURGE';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*)
      INTO v_count
      FROM user_tab_columns
     WHERE table_name = 'MURM_DIRECT'
       AND column_name = 'PHOTO_POST_ID';

    IF v_count > 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE MURM_DIRECT DROP COLUMN PHOTO_POST_ID';
    END IF;
END;
/

-- Remove eventuais índices órfãos de tentativas anteriores.
BEGIN
    FOR idx IN (
        SELECT index_name
          FROM user_indexes
         WHERE index_name IN (
             'IX_MURM_DIRECT_PHOTO',
             'IX_MURM_PHOTO_PRIVATE_OWNER'
         )
    ) LOOP
        EXECUTE IMMEDIATE 'DROP INDEX ' || DBMS_ASSERT.SIMPLE_SQL_NAME(idx.index_name);
    END LOOP;
END;
/
