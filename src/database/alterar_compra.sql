-- Verificar se a coluna ID_PAGAMENTO existe antes de adicionar
SET @dbname = 'blm7u1t1puofmkene4oq';
SET @tablename = 'COMPRA';
SET @columnname = 'ID_PAGAMENTO';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE 
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 'Coluna ID_PAGAMENTO já existe'",
  "ALTER TABLE COMPRA ADD COLUMN ID_PAGAMENTO varchar(255) DEFAULT NULL AFTER VALOR"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Atualizar a estrutura da tabela COMPRA para incluir AUTO_INCREMENT
ALTER TABLE `COMPRA`
MODIFY `ID_COMPRA` int NOT NULL AUTO_INCREMENT;

-- Atualizar a estrutura da tabela COMPRA para definir valores padrão
ALTER TABLE `COMPRA`
MODIFY `STATUS` tinyint(1) NOT NULL DEFAULT 0,
MODIFY `FORMA_PAGAMENTO` varchar(50) NOT NULL,
MODIFY `DATA_COMPRA` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY `VALOR` decimal(10,2) NOT NULL; 