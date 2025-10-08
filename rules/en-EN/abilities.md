# Abilities

{% range $index, $ability := .Vars.abilities %}

## {% add $index 1 %}. {% $ability.label %}

- **Description**: {% $ability.description %}
- **Coût**: `{% $ability.cost %}`

{% end %}
