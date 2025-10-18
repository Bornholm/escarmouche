{% range $index, $ability := .Vars.abilities %}

:attrs{id="{% $ability.id %}"}

## {% add $index 1 %}. {% $ability.label %}

- **Description**: {% $ability.description %}
- **Coût**: `{% $ability.cost %}`

{% end %}
