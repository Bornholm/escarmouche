# Reglas del juego

## Material

- 1 tablero de juego 8×8 casillas (tablero de ajedrez)
- Unidades, figuras o fichas personalizables (1 a 6 por jugador)
- Cartas descriptivas (1 por unidad)
- Marcadores de daño o estado
- 1 dado para determinar el primer jugador

## Composición de las escuadras

Cada jugador ensambla su escuadra respetando las siguientes restricciones:

- **1 a 6 unidades** máximo
- **30 puntos de rango (RP)** acumulados máximo (ver abajo)

Cada unidad tiene un rango, representando su poder global, identificado en su carta descriptiva. Los rangos son los siguientes:

- **Soldado**: 1 RP
- **Veterano**: 3 RP
- **Élite**: 6 RP
- **Campeón**: 10 RP
- **Parangón**: 15 RP

Una escuadra puede así estar compuesta:

- De 2 Parangones;
- De 2 Campeones, 1 Élite, 1 Veterano y 1 Soldado;
- Etc

Para facilitar la creación y composición de tus escuadras, una aplicación está disponible en línea, [**el Cuartel**](https://bornholm.github.io/escarmouche/barracks/).

> El cálculo del rango de cada unidad se basa en una fórmula compleja pero que permite equilibrar las escuadras, independientemente de las combinaciones utilizadas por el jugador.

## Características de las unidades

Cada unidad posee también 4 características principales:

| Característica | Descripción                                                            |
| -------------- | ---------------------------------------------------------------------- |
| **Salud**      | Puntos de vida máximos (cuando se reducen a 0, la unidad es eliminada) |
| **Alcance**    | Distancia máxima de ataque (en casillas)                               |
| **Potencia**   | Daño infligido por ataque                                              |
| **Movimiento** | Número de casillas recorribles por acción de movimiento                |

_Nota: Los movimientos en diagonal están permitidos._

## Preparación

1. Coloca el tablero entre los dos jugadores
2. Cada jugador posiciona sus unidades en **sus dos primeras filas** (filas 1-2 para un jugador, filas 7-8 para el otro)
3. Las unidades pueden ser colocadas libremente en estas filas de inicio
4. Lanza un dado para determinar quién comienza

## Desarrollo de un turno

En su turno, el jugador activo realiza **exactamente 2 acciones** entre:

### Acciones disponibles

- **Movimiento**: Mover una unidad de su valor de Movimiento máximo
- **Ataque**: Atacar una unidad enemiga al alcance y en línea de vista
- **Habilidad**: Activar una habilidad especial (si está disponible)

### Reglas de las acciones

- Las 2 acciones pueden ser realizadas por la **misma unidad** o **repartidas** en 2 unidades diferentes
- Una misma unidad puede realizar varias acciones en el turno
- **Restricción**: Una unidad solo puede realizar **1 solo ataque por turno** o activar **1 sola habilidad por turno**

## Combate

### Ataque

1. **Declaración**: Elegir un objetivo al alcance y en línea de vista
2. **Resolución**: El ataque tiene éxito automáticamente (salvo habilidad contraria)
3. **Daño**: El objetivo pierde un número de puntos de Salud igual a la Potencia del atacante
4. **Eliminación**: Si la Salud cae a 0 o menos, retira la unidad del tablero

### Línea de vista y cobertura

- Una unidad puede atacar si una **línea recta ininterrumpida** puede ser trazada entre ella y su objetivo
- Esta línea puede partir de **cualquier esquina** de la casilla del atacante
- Las **otras unidades** (aliadas o enemigas) bloquean la línea de vista
- **Obstáculo = Cobertura total** (ataque imposible)

## Condiciones de victoria

### Victoria Estándar

El primer jugador en eliminar **todas las unidades adversarias** gana la partida.

### Partidas con escenarios

`TODO`

## Puntos de reglas importantes

### Movimiento

- El movimiento en diagonal está permitido
- Una unidad puede detenerse en cualquier momento antes de haber usado todo su Movimiento
- Imposible atravesar una casilla ocupada por otra unidad

### Habilidades especiales

- Las habilidades reemplazan la acción de Ataque cuando se usan
- Consulta el texto específico de cada carta de habilidad
- Algunas habilidades pueden modificar las reglas estándar
