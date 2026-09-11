var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres").WithDataVolume();
var craftAiDb = postgres.AddDatabase("craftai");

var cache = builder.AddRedis("cache").WithDataVolume();

var migrationService = builder.AddProject<Projects.CraftAi_MigrationService>("migration-service")
    .WithReference(craftAiDb)
    .WaitFor(craftAiDb);

builder.AddProject<Projects.CraftAi_Api>("api")
    .WithReference(craftAiDb)
    .WithReference(cache)
    .WaitFor(craftAiDb)
    .WaitFor(cache)
    .WaitForCompletion(migrationService);

builder.Build().Run();
