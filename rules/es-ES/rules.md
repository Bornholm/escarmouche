# Reglas del juego

## Material

- 1 tablero de juego de 8×8 casillas (tablero de ajedrez)
- Unidades, miniaturas o fichas personalizables (1 a 6 por jugador)
- Cartas descriptivas (1 por unidad)
- 2 marcadores de obstáculo (1 por jugador)
- Marcadores de daño, de estado y de control
- 1 dado para determinar el primer jugador

## Composición de las escuadras

Cada jugador forma su escuadra respetando las siguientes restricciones:

- **1 a 6 unidades** máximo
- **100 puntos** de coste acumulado máximo

El coste de cada unidad figura en su carta descriptiva. Es la única moneda del
juego: cada punto gastado compra el mismo valor, sea cual sea la unidad.

Cada unidad lleva además un **título** (Soldado, Veterano, Élite, Campeón,
Parangón) según su banda de coste. Este título es puramente narrativo: viste
la carta y cuenta el poder de la unidad, pero no entra en ningún cálculo.

| Título       | Coste de la unidad |
| ------------ | ------------------ |
| **Soldado**  | 10 puntos o menos  |
| **Veterano** | 11 a 16 puntos     |
| **Élite**    | 17 a 22 puntos     |
| **Campeón**  | 23 a 27 puntos     |
| **Parangón** | 28 puntos o más    |

Para facilitar la creación y composición de tus escuadras, hay una aplicación
disponible en línea, [**el Cuartel**](https://bornholm.github.io/escarmouche/barracks/).

## Características de las unidades

Cada unidad posee 4 características principales:

| Característica | Descripción                                                     |
| -------------- | --------------------------------------------------------------- |
| **Salud**      | Puntos de vida máximos (al llegar a 0, la unidad es eliminada)  |
| **Alcance**    | Distancia máxima de ataque (en casillas)                        |
| **Potencia**   | Daño infligido por ataque                                       |
| **Movimiento** | Número de casillas recorribles por acción de movimiento         |

_Nota: las distancias se cuentan en casillas, **diagonales incluidas** — un
paso en diagonal cuenta como una casilla, tanto para el movimiento como para
el alcance._

## La zona central

Las **4 casillas centrales** del tablero (el cuadrado 2×2 en el cruce de las
columnas D-E y las filas 4-5) forman la **zona de objetivo**. Controlarla es
la principal vía hacia la victoria (ver Condiciones de victoria).

## Preparación

1. Coloca el tablero entre los dos jugadores
2. **Obstáculos**: cada jugador coloca 1 marcador de obstáculo en una casilla
   libre de su elección, **fuera de la zona central y fuera de las zonas de
   despliegue** (es decir, en las filas 3 a 6). El jugador con la menor tirada
   de dado coloca el suyo primero
3. **Despliegue alterno**: empezando por el jugador que colocó su obstáculo
   primero, cada uno coloca **una unidad a la vez**, por turnos, en **sus dos
   primeras filas** (filas 1-2 para un jugador, filas 7-8 para el otro). Se
   continúa hasta que ambas escuadras estén completamente desplegadas
4. Cada jugador ve por tanto las unidades ya colocadas por su adversario y
   puede responder a ellas: el despliegue es el primer acto táctico
5. Si un jugador tiene menos unidades que el otro, simplemente pasa su turno
   de colocación una vez desplegada su escuadra
6. Lanza un dado para determinar quién empieza la partida

### Obstáculos

- Una casilla de obstáculo es **infranqueable**: ninguna unidad puede
  detenerse en ella ni atravesarla
- Un obstáculo **bloquea la línea de visión** (cobertura total)

## Desarrollo de un turno

En su turno, el jugador activo efectúa **exactamente 2 acciones** entre:

### Acciones disponibles

- **Movimiento**: Desplazar una unidad hasta su valor de Movimiento
- **Ataque**: Atacar una unidad enemiga a alcance y en línea de visión
- **Habilidad**: Activar una habilidad especial (si está disponible)

### Reglas de las acciones

- Las 2 acciones pueden efectuarse por la **misma unidad** o **repartirse** entre 2 unidades diferentes
- Una misma unidad puede efectuar varias acciones en el turno
- **Restricción**: Una unidad solo puede efectuar **1 ataque por turno** y activar solo **1 habilidad por turno**
- Una unidad puede por tanto **atacar y usar una habilidad** en el mismo turno (si cada una se efectúa como acción separada)

### Fin de turno: control de la zona

Al **final de su turno**, el jugador activo comprueba si **controla la zona
central**: al menos una de sus unidades está dentro y **ninguna** unidad
enemiga lo está. Si es así, gana **1 marcador de control**.

## Combate

### Ataque

1. **Declaración**: Elegir un objetivo a alcance y en línea de visión
2. **Resolución**: El ataque tiene éxito automáticamente (salvo habilidad contraria)
3. **Daño**: El objetivo pierde un número de puntos de Salud igual a la Potencia del atacante
4. **Eliminación**: Si la Salud cae a 0 o menos, retira la unidad del tablero

### Línea de visión y cobertura

- Una unidad puede atacar si puede trazarse una **línea recta ininterrumpida** entre ella y su objetivo
- Esta línea puede partir de **cualquier esquina** de la casilla del atacante
- Las **otras unidades** (aliadas o enemigas) y los **obstáculos** bloquean la línea de visión
- **Obstáculo = Cobertura total** (ataque imposible)

## Condiciones de victoria

La partida se gana de una de las dos formas siguientes:

### Victoria por captura

El primer jugador en acumular **3 marcadores de control** de la zona central
gana inmediatamente la partida.

### Victoria por eliminación

Un jugador que elimina **todas las unidades enemigas** gana inmediatamente la
partida.

> Consejo: la zona central fuerza el enfrentamiento. Acampar en tu esquina es
> dejar que el adversario acumule tranquilamente sus marcadores de control.

## Puntos de reglas importantes

### Movimiento

- El movimiento en diagonal está permitido
- Una unidad puede detenerse en cualquier momento antes de usar todo su Movimiento
- Es imposible atravesar una casilla ocupada por otra unidad o un obstáculo

### Habilidades especiales

- Las habilidades constituyen un **tercer tipo de acción**, distinto del Movimiento y del Ataque
- Consulta el texto específico de cada carta de habilidad para sus efectos
- Algunas habilidades pueden modificar las reglas estándar o aplicar efectos de estado

### Efectos de estado

Algunas habilidades aplican efectos persistentes sobre las unidades. Las
duraciones se leen siempre **desde el punto de vista del propietario de la
unidad afectada**:

| Efecto | Fuente | Consecuencia |
| ------ | ------ | ------------ |
| **Supresión** | Fuego de Supresión | La unidad objetivo solo puede efectuar **una única acción** en su próximo turno |
| **Inseleccionable** | Retirada Táctica | La unidad no puede ser objetivo de ataques hasta el inicio de su próximo turno |
| **Sobrecarga** | Sobrecarga | La unidad no puede atacar en su próximo turno |
| **Postura Defensiva** | Postura Defensiva | El próximo punto de daño infligido a la unidad queda anulado (no acumulable) |
| **Protección** | Guardián | El daño recibido por una unidad aliada adyacente se redirige a la unidad guardiana hasta el inicio de su próximo turno |
