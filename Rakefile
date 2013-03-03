task :default => ['test']

desc "run all the tests"
task :test do
  system "npm install ; bin/mocha test/*/*test.js"
end
desc "initialize the enviroment and run all the tests"
task :test_env do
  system ". ~/.nvm/nvm.sh ; bin/mocha test/*/*test.js"
end