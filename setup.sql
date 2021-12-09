-- file to set up the database
--        first VARCHAR NOT NULL CHECK (first != ''), make sure its a string and not empty
 
 DROP TABLE IF EXISTS signatures;

   CREATE TABLE signatures (
       id SERIAL PRIMARY KEY,
       first VARCHAR NOT NULL CHECK (first != ''),
       last VARCHAR NOT NULL CHECK (last != ''),
       signature VARCHAR NOT NULL CHECK (signature != '')
   );

-- id, first, last, signature  

INSERT INTO signatures (first, last, signature) VALUES ('Luise', 'Brandenburger', 'String for Signature Picture Luise');
INSERT INTO signatures (first, last, signature) VALUES ('Michael', 'Risberg', 'String for Signature Picture Michi');

-- SELECT * FROM signatures;
-- SELECT (first, last) FROM signatures;
