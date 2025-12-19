import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DynamicField } from "@shared/storeTypes";
import { UseFormReturn } from "react-hook-form";

interface DynamicFieldRendererProps {
  field: DynamicField;
  form: UseFormReturn<any>;
  basePath?: string;
}

export function DynamicFieldRenderer({ field, form, basePath = "dynamicFields" }: DynamicFieldRendererProps) {
  const fieldName = basePath ? `${basePath}.${field.name}` : field.name;

  if (field.type === "select") {
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>
              {field.label} {field.required && "*"}
            </FormLabel>
            <Select onValueChange={formField.onChange} value={formField.value}>
              <FormControl>
                <SelectTrigger data-testid={`select-${field.name}`}>
                  <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option} data-testid={`option-${field.name}-${option}`}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && <FormDescription>{field.description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (field.type === "multiselect") {
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={() => (
          <FormItem>
            <FormLabel>
              {field.label} {field.required && "*"}
            </FormLabel>
            <FormDescription>{field.description}</FormDescription>
            <div className="grid grid-cols-2 gap-2" data-testid={`multiselect-${field.name}`}>
              {field.options?.map((option) => (
                <FormField
                  key={option}
                  control={form.control}
                  name={fieldName}
                  render={({ field: formField }) => {
                    const currentValue = formField.value || [];
                    return (
                      <FormItem
                        key={option}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={currentValue.includes(option)}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...currentValue, option]
                                : currentValue.filter((value: string) => value !== option);
                              formField.onChange(newValue);
                            }}
                            data-testid={`checkbox-${field.name}-${option}`}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{option}</FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>
              {field.label} {field.required && "*"}
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={field.placeholder}
                {...formField}
                data-testid={`textarea-${field.name}`}
                rows={3}
              />
            </FormControl>
            {field.description && <FormDescription>{field.description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (field.type === "number") {
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>
              {field.label} {field.required && "*"}
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder={field.placeholder}
                {...formField}
                data-testid={`input-${field.name}`}
                onChange={(e) => formField.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            {field.description && <FormDescription>{field.description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (field.type === "date") {
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>
              {field.label} {field.required && "*"}
            </FormLabel>
            <FormControl>
              <Input
                type="date"
                {...formField}
                data-testid={`input-${field.name}`}
              />
            </FormControl>
            {field.description && <FormDescription>{field.description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Default to text input
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>
            {field.label} {field.required && "*"}
          </FormLabel>
          <FormControl>
            <Input
              placeholder={field.placeholder}
              {...formField}
              data-testid={`input-${field.name}`}
            />
          </FormControl>
          {field.description && <FormDescription>{field.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
