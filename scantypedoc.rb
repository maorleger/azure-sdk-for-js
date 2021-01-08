require 'pp'
require 'set'
require 'json'

all_keys = {
  "includeDeclarations" => false,
  "excludePrivate" => false,
  "excludeNotExported" => false,
  "exclude" => nil,
  "ignoreCompilerErrors" => false,
  "mode" => nil,
  "out" => nil,
  "excludeExternals" => false
}
boring_keys = ["readme", "name", "source", "kind"]

# Collect all typedoc.json config
typedoc_definitions = Dir.glob("**/typedoc.json").map do |filepath|
  JSON.parse(File.read(filepath)).tap do |json|
    json["source"] = filepath
    json["kind"] = "typedoc.json"
  end
end
puts typedoc_definitions.count

package_typedoc_definitions = Dir.glob("sdk/**/package.json").map do |filepath|
  json = JSON.parse(File.read(filepath))
  result = {}
  if json["scripts"] && json["scripts"]["docs"] && json["scripts"]["docs"] =~ /typedoc/
    result["source"] = filepath
    result["kind"] = "package.json"
    match = json["scripts"]["docs"].scan(/(--(?<option>.+?)\s+(?<value>.(?:[^-].+?)?(?:(?=--)|$))?)+?/)
    unless match.any? { |m| m[0] == "excludeNotExported"}
      p match.inspect
      p filepath
    end
    match.each do |m|
      k,v = m[0], m[1]
      result[k] = v ? v.strip : true 
    end
  end
  result
end.reject(&:empty?)

all_definitions = typedoc_definitions + package_typedoc_definitions

# backfill missing keys with default values
all_definitions.each do |definition|
  all_keys.each do |k, v|
    definition[k] = v unless definition.key?(k)
  end
end

counts = all_definitions.each_with_object({}) do |hsh, totals|
  hsh.each do |k, v|
    totals[k] ||= {}
    totals[k][v] ||= 0
    totals[k][v] += 1
  end
end.reject { |k, v| boring_keys.include?(k) }

puts JSON.pretty_generate(counts)


typedoc_definitions.each do |def_file|
  pkg_def = package_typedoc_definitions.find { |hsh| File.dirname(hsh["source"]) == File.dirname(def_file["source"])}
  if pkg_def
    p "#{def_file["source"]}: non-overridden configs: #{def_file.keys.reject { |k| pkg_def.keys.include?(k) }}"
  else
    p "#{def_file["source"]}: no command line flags"  
  end
end
