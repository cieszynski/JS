# JS
## T13E TemplateEngine
T13E renders text templates on request.

### Textmarks
* Currency  
#{var or num}:c(var or "currency-code")  
currency-code: "EUR", "USD",...  
* Number  
#{var or num}:n([FractionDigits (default:2)])
* String  
#{var or str or num}:s()  
String like it is  
* Unit  
#{var or num or str}:u(unit as "string")  
* Plural  
#{var or num}:P(object)  
object like {0: "zero peaces", 1: "one peace", 2: "many peaces"}

### Datasource
Datasource is a javascript object with keys and values. Values
can created by following functions:
* Random number range  
range(min, max, steps)  
* Random item from array  
arange(arr)

### Usage  
    let result = T13E.format(text, T13E.prepare(source));

### Example
*Text:*

    The sum of #{a}:n(0) + #{b}:n(0) is #{a+b}:n(0).

*Source:*

    {
        a: range(1, 9, 2),
        b: range(2,10,2)
    }

*Possible result:*

    "The sum of 1 + 2 is 3."